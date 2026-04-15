from __future__ import annotations

import sympy as sp

from qupde.cli.constants import InputFormat, SearchAlg, SortFun
from qupde.cli.errors import ParseError, QuadratizationError
from qupde.cli.service import QuadratizationRequest, run_quadratization

from app.examples_loader import get_example
from app.pde_input_normalize import PdeInputNormalizeError, normalize_custom_equations
from app.schemas import QuadratizeRequest, QuadratizeResponse

class QuadratizeServiceError(Exception):
    pass


def _evolution_spatial_from_example_vars(vars_csv: str, first_indep: str) -> tuple[str, str]:
    parts = [p.strip() for p in vars_csv.split(",") if p.strip()]
    fi = first_indep.strip()
    others = [p for p in parts if p != fi]
    if others:
        return fi, others[0]
    if len(parts) == 2:
        return (fi, parts[1]) if parts[0] == fi else (fi, parts[0])
    return fi, "x"


def quadratize_request(payload: QuadratizeRequest) -> QuadratizeResponse:
    if payload.mode == "example":
        if not payload.example_id:
            raise QuadratizeServiceError("example_id is required.")
        example = get_example(payload.example_id)
        if example is None:
            raise QuadratizeServiceError("Example not found.")
        evolution_var, spatial_var = _evolution_spatial_from_example_vars(example.vars, example.first_indep)
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

        try:
            eq_strings, ordered_vars = normalize_custom_equations(
                payload.equations,
                payload.format,
                payload.vars,
                payload.funcs,
            )
        except PdeInputNormalizeError as exc:
            raise QuadratizeServiceError(str(exc)) from exc
        ov = [p.strip() for p in ordered_vars.split(",") if p.strip()]
        evolution_var, spatial_var = (ov[0], ov[1]) if len(ov) == 2 else (ov[0] if ov else "t", "x")
        req = QuadratizationRequest(
            eq_strings=eq_strings,
            indep_vars=ordered_vars,
            func_names=payload.funcs,
            input_format=InputFormat.sympy,
            diff_ord=payload.diff_ord,
            sort_fun=SortFun(payload.sort_fun),
            nvars_bound=payload.nvars_bound,
            search_alg=SearchAlg(payload.search_alg),
            show_nodes=payload.show_nodes,
        )
    try:
        result = run_quadratization(req)
    except QuadratizationError as exc:
        # qupde raises QuadratizationError() with no message when no quadratization exists
        msg = str(exc).strip()
        raise QuadratizeServiceError(msg or "Quadratization not found.") from exc
    except ParseError as exc:
        raise QuadratizeServiceError(str(exc)) from exc
    if len(result.frac_vars) > 0:
        result.frac_vars = [(result.frac_vars[0][0], 1/result.frac_vars[0][1].as_expr())]
        
    latex_output = {
        "aux_vars": [sp.latex(expr) for expr in result.aux_vars],
        "frac_vars": [sp.latex(expr) for expr in result.frac_vars],
        "quad_sys": [sp.latex(expr) for expr in result.quad_sys],
    }

    evolution_var_latex: str | None = None
    spatial_var_latex: str | None = None
    if (
        payload.mode == "example"
        and payload.example_id == "solar_wind"
        and spatial_var == "phi"
    ):
        spatial_var_latex = r"\phi"

    return QuadratizeResponse(
        aux_vars=[sp.sstr(expr) for expr in result.aux_vars],
        frac_vars=[sp.sstr(expr) for expr in result.frac_vars],
        quad_sys=[sp.sstr(expr) for expr in result.quad_sys],
        traversed=result.traversed,
        latex_output=latex_output,
        evolution_var=evolution_var,
        spatial_var=spatial_var,
        evolution_var_latex=evolution_var_latex,
        spatial_var_latex=spatial_var_latex,
    )
