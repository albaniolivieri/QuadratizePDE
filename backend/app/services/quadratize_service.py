from __future__ import annotations

import sympy as sp
import inspect

from qupde.cli.constants import InputFormat, SearchAlg, SortFun
from qupde.cli.errors import ParseError, QuadratizationError
from qupde.cli.service import QuadratizationRequest, run_quadratization

from app.examples_loader import get_example
from app.schemas import QuadratizeRequest, QuadratizeResponse

class QuadratizeServiceError(Exception):
    pass


def quadratize_request(payload: QuadratizeRequest) -> QuadratizeResponse:
    if payload.mode == "example":
        if not payload.example_id:
            raise QuadratizeServiceError("example_id is required.")
        example = get_example(payload.example_id)
        if example is None:
            raise QuadratizeServiceError("Example not found.")
        req = QuadratizationRequest(
            func_eq=example.func_eq,
            indep_symbol=sp.symbols(example.first_indep),
            diff_ord=payload.diff_ord if payload.diff_ord is not None else example.diff_ord,
            sort_fun=SortFun(payload.sort_fun),
            nvars_bound=payload.nvars_bound,
            first_indep=example.first_indep,
            search_alg=SearchAlg(payload.search_alg),
            show_nodes=payload.show_nodes,
        )
    else:
        if not payload.equations or not payload.vars or not payload.funcs:
            raise QuadratizeServiceError(
                "equations, vars, and funcs are required for custom mode."
            )

        eq_strings = payload.equations
        input_format = payload.format
        if input_format == "latex":
            try:
                from sympy.parsing.latex import parse_latex
            except ImportError as e:
                raise QuadratizeServiceError(
                    "LaTeX parsing requires the antlr4-python3-runtime package. "
                    "Please install it with: uv sync (or pip install antlr4-python3-runtime>=4.11)"
                ) from e
            
            sympy_strings = []
            for i, latex_str in enumerate(payload.equations):
                try:
                    expr = parse_latex(latex_str.strip())
                    if isinstance(expr, sp.Equality):
                        sympy_strings.append(f"{sp.sstr(expr.lhs)} = {sp.sstr(expr.rhs)}")
                    else:
                        raise QuadratizeServiceError(
                            f"Parsed LaTeX equation {i + 1} is not an equality (got: {type(expr).__name__})."
                        )
                except Exception as e:
                    error_msg = str(e)
                    if "antlr4" in error_msg.lower():
                        raise QuadratizeServiceError(
                            "LaTeX parsing requires the antlr4-python3-runtime package. "
                            "Please restart the backend server after installing it with: uv sync"
                        ) from e
                    raise QuadratizeServiceError(
                        f"Failed to parse LaTeX equation {i + 1}: {error_msg}"
                    ) from e
            eq_strings = sympy_strings
            input_format = "sympy"

        req = QuadratizationRequest(
            eq_strings=eq_strings,
            indep_vars=payload.vars,
            func_names=payload.funcs,
            input_format=InputFormat(input_format),
            diff_ord=payload.diff_ord,
            sort_fun=SortFun(payload.sort_fun),
            nvars_bound=payload.nvars_bound,
            search_alg=SearchAlg(payload.search_alg),
            show_nodes=payload.show_nodes,
        )
    try:
        result = run_quadratization(req)
    except (ParseError, QuadratizationError) as exc:
        raise QuadratizeServiceError(str(exc)) from exc

    latex_output = {
        "aux_vars": [sp.latex(expr) for expr in result.aux_vars],
        "frac_vars": [sp.latex(expr) for expr in result.frac_vars],
        "quad_sys": [sp.latex(expr) for expr in result.quad_sys],
    }

    return QuadratizeResponse(
        aux_vars=[sp.sstr(expr) for expr in result.aux_vars],
        frac_vars=[sp.sstr(expr) for expr in result.frac_vars],
        quad_sys=[sp.sstr(expr) for expr in result.quad_sys],
        traversed=result.traversed,
        latex_output=latex_output,
    )
