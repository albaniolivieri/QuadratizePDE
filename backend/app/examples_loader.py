from __future__ import annotations

from qupde.examples_registry import ExampleData, get_example as _get_example, list_examples as _list_examples


def get_example(example_id: str) -> ExampleData | None:
    return _get_example(example_id)


def list_examples() -> list[ExampleData]:
    return _list_examples()
