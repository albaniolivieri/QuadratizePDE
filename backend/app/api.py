from __future__ import annotations

from fastapi import APIRouter, HTTPException
import sympy as sp

from qupde.cli.constants import InputFormat, SearchAlg, SortFun
from qupde.cli.errors import ParseError, QuadratizationError
from qupde.cli.service import QuadratizationRequest, run_quadratization

from app.examples_loader import get_example, list_examples
from app.schemas import ExampleDetail, ExampleSummary, QuadratizeRequest, QuadratizeResponse

router = APIRouter(prefix="/api")


@router.get("/examples", response_model=list[ExampleSummary])
async def list_examples_endpoint():
    try:
        examples = list_examples()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return [
        ExampleSummary(
            id=example.id,
            name=example.name,
            description=example.description,
            diff_ord=example.diff_ord,
            first_indep=example.first_indep,
            equations_latex=example.equations_latex,
        )
        for example in examples
    ]


@router.get("/examples/{example_id}", response_model=ExampleDetail)
async def example_detail_endpoint(example_id: str):
    example = get_example(example_id)
    if example is None:
        raise HTTPException(status_code=404, detail="Example not found.")

    return ExampleDetail(
        id=example.id,
        name=example.name,
        description=example.description,
        diff_ord=example.diff_ord,
        first_indep=example.first_indep,
        equations=example.equations,
        equations_latex=example.equations_latex,
        vars=example.vars,
        funcs=example.funcs,
    )


@router.post("/quadratize", response_model=QuadratizeResponse)
async def quadratize_endpoint(payload: QuadratizeRequest):
    if payload.mode == "example":
        if not payload.example_id:
            raise HTTPException(status_code=400, detail="example_id is required.")
        example = get_example(payload.example_id)
        if example is None:
            raise HTTPException(status_code=404, detail="Example not found.")

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
            raise HTTPException(
                status_code=400,
                detail="equations, vars, and funcs are required for custom mode.",
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
        raise HTTPException(status_code=400, detail=str(exc)) from exc

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
