from __future__ import annotations

import sympy as sp

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
            diff_ord=payload.diff_ord or example.diff_ord,
            sort_fun=SortFun(payload.sort_fun),
            nvars_bound=payload.nvars_bound,
            first_indep=example.first_indep,
            max_der_order=payload.max_der_order,
            search_alg=SearchAlg(payload.search_alg),
            show_nodes=payload.show_nodes,
        )
    else:
        if not payload.equations or not payload.vars or not payload.funcs:
            raise QuadratizeServiceError(
                "equations, vars, and funcs are required for custom mode."
            )

        req = QuadratizationRequest(
            eq_strings=payload.equations,
            indep_vars=payload.vars,
            func_names=payload.funcs,
            input_format=InputFormat(payload.format),
            diff_ord=payload.diff_ord,
            sort_fun=SortFun(payload.sort_fun),
            nvars_bound=payload.nvars_bound,
            max_der_order=payload.max_der_order,
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
