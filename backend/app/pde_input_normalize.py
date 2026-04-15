from __future__ import annotations

import re
from typing import Literal

import sympy as sp
from sympy.parsing.mathematica import parse_mathematica
from sympy.parsing.sympy_parser import parse_expr

from qupde.cli.parsing import _coerce_derivatives, _to_derivative


class PdeInputNormalizeError(ValueError):
    """Invalid PDE input before quadratization (user-facing message)."""


def _split_csv(raw: str, label: str) -> list[str]:
    values = [part.strip() for part in raw.split(",") if part.strip()]
    if not values:
        raise PdeInputNormalizeError(f"{label} cannot be empty.")
    return values


def _normalize_symbols(expr: sp.Expr, symbol_map: dict[str, sp.Symbol]) -> sp.Expr:
    replacements = {
        sym: symbol_map[sym.name]
        for sym in expr.free_symbols
        if sym.name in symbol_map
    }
    if not replacements:
        return expr
    return expr.xreplace(replacements)


def _leibniz_frac_to_nested_partial(var: str, expr: str, order: int) -> str:
    """SymPy-compatible nested \\frac form for \\partial^order / \\partial var^order."""
    core = rf"\frac{{\partial {expr}}}{{\partial {var}}}"
    for _ in range(1, order):
        core = rf"\frac{{\partial}}{{\partial {var}}}\left({core}\right)"
    return core


def _preprocess_latex_leibniz_higher_partials(latex: str) -> str:
    """
    SymPy's parse_latex mis-reads \\frac{\\partial^n f}{\\partial x^n} as algebra in a
    symbol named ``partial``. Rewrite to nested first-order fractions, which parse to
    Derivative(..., (x, n)).
    """
    out = latex
    for order in range(12, 1, -1):
        k_pat = rf"(?:\{{{order}\}}|{order})"
        pat = (
            r"\\frac\{\\partial\^" + k_pat + r"\s*([^}]+?)\}"
            r"\{"
            + r"\\partial\s*([a-zA-Z_]\w*)\^"
            + k_pat
            + r"\}"
        )

        def repl(m: re.Match[str], o: int = order) -> str:
            expr, var = m.group(1).strip(), m.group(2)
            return _leibniz_frac_to_nested_partial(var, expr, o)

        out = re.sub(pat, repl, out)
    return out


def _parse_latex_line(latex_str: str, i: int) -> sp.Equality:
    try:
        from sympy.parsing.latex import parse_latex
    except ImportError as e:
        raise PdeInputNormalizeError(
            "LaTeX parsing requires the antlr4-python3-runtime package. "
            "Please install it with: uv sync (or pip install antlr4-python3-runtime>=4.11)"
        ) from e
    try:
        prepared = _preprocess_latex_leibniz_higher_partials(latex_str.strip())
        expr = parse_latex(prepared)
    except Exception as e:
        error_msg = str(e)
        if "antlr4" in error_msg.lower():
            raise PdeInputNormalizeError(
                "LaTeX parsing requires the antlr4-python3-runtime package. "
                "Please restart the backend server after installing it with: uv sync"
            ) from e
        raise PdeInputNormalizeError(
            f"Failed to parse LaTeX equation {i + 1}: {error_msg}"
        ) from e
    if not isinstance(expr, sp.Equality):
        raise PdeInputNormalizeError(
            f"Parsed LaTeX equation {i + 1} is not an equality (got: {type(expr).__name__})."
        )
    return expr


def _parse_sympy_line(eq_str: str, i: int, syms: dict[str, sp.Symbol], func_names: list[str]) -> tuple[sp.Expr, sp.Expr]:
    if "=" not in eq_str:
        raise PdeInputNormalizeError(f"SymPy equation {i + 1} must contain '='.")
    lhs_str, rhs_str = eq_str.split("=", 1)
    parser_locals: dict = {
        **syms,
        "Derivative": sp.Derivative,
        "D": sp.Derivative,
    }
    for fname in func_names:
        parser_locals[fname] = sp.Function(fname)
    try:
        lhs = parse_expr(lhs_str.strip(), local_dict=parser_locals, evaluate=False)
        rhs = parse_expr(rhs_str.strip(), local_dict=parser_locals, evaluate=False)
    except Exception as e:
        raise PdeInputNormalizeError(f"Failed to parse SymPy equation {i + 1}: {e}") from e
    lhs = _normalize_symbols(lhs, syms)
    rhs = _normalize_symbols(rhs, syms)
    return lhs, rhs


def _parse_mathematica_line(eq_str: str, i: int, syms: dict[str, sp.Symbol], func_names: list[str]) -> tuple[sp.Expr, sp.Expr]:
    if "==" not in eq_str:
        raise PdeInputNormalizeError(f"Mathematica equation {i + 1} must contain '=='.")
    lhs_str, rhs_str = eq_str.split("==", 1)
    try:
        lhs = parse_mathematica(lhs_str.strip())
        rhs = parse_mathematica(rhs_str.strip())
    except Exception as e:
        raise PdeInputNormalizeError(f"Failed to parse Mathematica equation {i + 1}: {e}") from e
    lhs = _normalize_symbols(lhs, syms)
    rhs = _normalize_symbols(rhs, syms)
    return lhs, rhs


def _lhs_evolution_symbol(lhs: sp.Expr) -> sp.Symbol:
    lhs = _coerce_derivatives(lhs)
    lhs = _to_derivative(lhs)
    if not isinstance(lhs, sp.Derivative):
        raise PdeInputNormalizeError(
            "Left-hand side must be a derivative in one of the independent variables, "
            "e.g. Derivative(u(t, x), t) or D[u[t, x], t]."
        )
    if not lhs.variables:
        raise PdeInputNormalizeError("Left-hand side derivative has no differentiation variable.")
    wrt = lhs.variables[0]
    if not isinstance(wrt, sp.Symbol):
        raise PdeInputNormalizeError(
            "Left-hand side must differentiate with respect to a simple independent variable symbol."
        )
    return wrt


def _canonicalize_func_args(
    expr: sp.Expr, func_names: list[str], evo: sp.Symbol, other: sp.Symbol
) -> sp.Expr:
    target = {evo, other}
    for name in func_names:
        f_cls = sp.Function(name)
        expr = expr.replace(
            lambda e, F=f_cls, t=target, evo=evo, other=other: (
                e.is_Function
                and e.func == F
                and len(e.args) == 2
                and set(e.args) == t
            ),
            lambda e, F=f_cls, evo=evo, other=other: F(evo, other),
        )
    return expr


def normalize_custom_equations(
    equations: list[str],
    input_format: Literal["sympy", "mathematica", "latex"],
    vars_csv: str,
    funcs_csv: str,
) -> tuple[list[str], str]:
    """
    Parse user equations, infer (evolution, other) from the first LHS derivative,
    canonicalize unknowns as f(evo, other), return SymPy equation strings and ordered vars.
    """
    var_names = _split_csv(vars_csv, "Independent variables")
    func_names = _split_csv(funcs_csv, "Dependent variables (functions)")
    if len(var_names) != 2:
        raise PdeInputNormalizeError("Exactly two independent variables are required.")
    if not equations:
        raise PdeInputNormalizeError("At least one equation is required.")
    syms = {n: sp.symbols(n) for n in var_names}
    name_set = set(var_names)

    parsed: list[tuple[sp.Expr, sp.Expr]] = []
    for i, line in enumerate(equations):
        if input_format == "latex":
            eq = _parse_latex_line(line, i)
            lhs, rhs = eq.lhs, eq.rhs
            lhs = _normalize_symbols(lhs, syms)
            rhs = _normalize_symbols(rhs, syms)
        elif input_format == "sympy":
            lhs, rhs = _parse_sympy_line(line, i, syms, func_names)
        else:
            lhs, rhs = _parse_mathematica_line(line, i, syms, func_names)

        lhs = _coerce_derivatives(lhs)
        rhs = _coerce_derivatives(rhs)
        lhs = _to_derivative(lhs)

        wrt = _lhs_evolution_symbol(lhs)
        if wrt.name not in name_set:
            raise PdeInputNormalizeError(
                f"Equation {i + 1}: derivative is with respect to '{wrt.name}', "
                f"which is not listed in independent variables ({vars_csv})."
            )

        if i == 0:
            evo_name = wrt.name
        elif wrt.name != evo_name:
            raise PdeInputNormalizeError(
                f"Equation {i + 1} differentiates with respect to '{wrt.name}', "
                f"but equation 1 uses '{evo_name}'. All equations must use the same evolution variable."
            )

        parsed.append((lhs, rhs))

    evo = syms[evo_name]
    other_name = next(n for n in var_names if n != evo_name)
    other = syms[other_name]

    out_lines: list[str] = []
    for lhs, rhs in parsed:
        lhs_c = _canonicalize_func_args(lhs, func_names, evo, other)
        rhs_c = _canonicalize_func_args(rhs, func_names, evo, other)
        out_lines.append(f"{sp.sstr(lhs_c)} = {sp.sstr(rhs_c)}")

    ordered_vars_csv = f"{evo_name},{other_name}"
    return out_lines, ordered_vars_csv
