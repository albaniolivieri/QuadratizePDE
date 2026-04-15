from __future__ import annotations

import re

from app.examples_loader import get_example, list_examples
from app.schemas import ExampleDetail, ExampleSummary

# Put the bibliography / citation on its own line
_REFERENCE_LINE_BREAK_RE = re.compile(r"\s+(\bReferences?:)", re.IGNORECASE)
_LINEBREAKS_RE = re.compile(r"\s*\n+\s*")

# Examples to hide from the UI.
_EXCLUDE_EXAMPLE_NAME_TERMS: tuple[str, ...] = (
    "arrhenius",
)

# Local display overrides (qupde registry names are short)
_EXAMPLE_DISPLAY_NAMES: dict[str, str] = {
    "nonlinear_heat_equation": "Nonlinear Heat equation",
}


def _example_display_name(example_id: str, name: str) -> str:
    return _EXAMPLE_DISPLAY_NAMES.get(example_id, name)


def _description_with_reference_line_break(description: str) -> str:
    # Keep descriptions as a single paragraph. The only intentional line break
    # is the "References:" section (added below).
    normalized = _LINEBREAKS_RE.sub(" ", description).strip()
    return _REFERENCE_LINE_BREAK_RE.sub(r"\n\1", normalized)

def _should_exclude_example(name: str) -> bool:
    lowered = name.lower()
    return any(term in lowered for term in _EXCLUDE_EXAMPLE_NAME_TERMS)


def list_example_summaries() -> list[ExampleSummary]:
    examples = list_examples()
    return [
        ExampleSummary(
            id=example.id,
            name=_example_display_name(example.id, example.name),
            description=_description_with_reference_line_break(example.description),
            diff_ord=example.diff_ord,
            first_indep=example.first_indep,
            equations_latex=example.equations_latex,
        )
        for example in examples
        if not _should_exclude_example(example.name)
    ]


def get_example_detail(example_id: str) -> ExampleDetail | None:
    example = get_example(example_id)
    if example is None:
        return None
    if _should_exclude_example(example.name):
        return None

    return ExampleDetail(
        id=example.id,
        name=_example_display_name(example.id, example.name),
        description=_description_with_reference_line_break(example.description),
        diff_ord=example.diff_ord,
        first_indep=example.first_indep,
        equations=example.equations,
        equations_latex=example.equations_latex,
        vars=example.vars,
        funcs=example.funcs,
    )
