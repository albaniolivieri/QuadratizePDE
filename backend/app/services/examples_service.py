from __future__ import annotations

from app.examples_loader import get_example, list_examples
from app.schemas import ExampleDetail, ExampleSummary


def list_example_summaries() -> list[ExampleSummary]:
    examples = list_examples()
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


def get_example_detail(example_id: str) -> ExampleDetail | None:
    example = get_example(example_id)
    if example is None:
        return None

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
