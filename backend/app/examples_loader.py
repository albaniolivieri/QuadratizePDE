from __future__ import annotations

import ast
import importlib.util
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Iterable

import sympy as sp
import qupde

def _resolve_examples_path() -> Path:
    env_path = os.environ.get("QUPDE_EXAMPLES_PATH")
    if env_path:
        return Path(env_path)

    qupde_root = Path(qupde.__file__).resolve().parent.parent
    candidate = qupde_root / "examples"
    if candidate.exists():
        return candidate

    raise FileNotFoundError(
        "Examples directory not found. Set QUPDE_EXAMPLES_PATH to the QuPDE examples folder."
    )


@dataclass(frozen=True)
class ExampleData:
    id: str
    name: str
    description: str
    diff_ord: int
    first_indep: str
    func_eq: list[tuple[sp.Function, sp.Expr]]
    vars: str
    funcs: str
    equations: list[str]
    equations_latex: list[str]


def _name_from_node(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Constant):
        return str(node.value)
    return None


def _find_quadratize_call(tree: ast.AST) -> ast.Call | None:
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            func = node.func
            if isinstance(func, ast.Name) and func.id == "quadratize":
                return node
            if isinstance(func, ast.Attribute) and func.attr == "quadratize":
                return node
    return None


def _extract_func_pairs(node: ast.AST) -> list[tuple[str, str]]:
    if not isinstance(node, (ast.List, ast.Tuple)):
        return []
    pairs: list[tuple[str, str]] = []
    for elt in node.elts:
        if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2:
            func_name = _name_from_node(elt.elts[0])
            expr_name = _name_from_node(elt.elts[1])
            if func_name and expr_name:
                pairs.append((func_name, expr_name))
    return pairs


def _extract_kw_int(call: ast.Call, keyword: str, default: int) -> int:
    for kw in call.keywords:
        if kw.arg == keyword:
            if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
                return kw.value.value
    return default


def _extract_kw_symbol(call: ast.Call, keyword: str, default: str) -> str:
    for kw in call.keywords:
        if kw.arg == keyword:
            if isinstance(kw.value, ast.Name):
                return kw.value.id
            if isinstance(kw.value, ast.Constant):
                return str(kw.value.value)
    return default


def _safe_title(name: str) -> str:
    if name.isupper():
        return name
    parts = name.replace("-", " ").replace("_", " ").split()
    return " ".join(part.capitalize() for part in parts)


def _module_from_file(file_path: Path) -> object:
    safe_stem = "".join(
        ch if ch.isalnum() or ch == "_" else "_" for ch in file_path.stem.lower()
    )
    module_name = f"qupde_example_{safe_stem}"
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load example module from {file_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _func_name(func: sp.Function) -> str:
    func_obj = func.func
    name = getattr(func_obj, "__name__", None) or getattr(func_obj, "name", None)
    return name if name else str(func_obj)


def _unique(items: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


@lru_cache(maxsize=1)
def load_examples(examples_path: Path | None = None) -> dict[str, ExampleData]:
    resolved_path = examples_path or _resolve_examples_path()
    if not resolved_path.exists():
        raise FileNotFoundError(
            f"Examples directory not found: {resolved_path}. Set QUPDE_EXAMPLES_PATH."
        )

    examples: dict[str, ExampleData] = {}
    for file_path in sorted(resolved_path.glob("*.py")):
        tree = ast.parse(file_path.read_text())
        description = ast.get_docstring(tree) or ""
        call = _find_quadratize_call(tree)
        func_pairs: list[tuple[str, str]] = []
        diff_ord = 2
        first_indep = "t"

        if call is not None:
            if call.args:
                func_pairs = _extract_func_pairs(call.args[0])
            diff_ord = _extract_kw_int(call, "diff_ord", diff_ord)
            first_indep = _extract_kw_symbol(call, "first_indep", first_indep)

        module = _module_from_file(file_path)
        namespace = vars(module)

        func_eq: list[tuple[sp.Function, sp.Expr]] = []
        for func_name, expr_name in func_pairs:
            func_obj = namespace.get(func_name)
            expr_obj = namespace.get(expr_name)
            if isinstance(func_obj, sp.Function) and isinstance(expr_obj, sp.Expr):
                func_eq.append((func_obj, expr_obj))

        if not func_eq:
            continue

        indep_symbol = sp.symbols(first_indep)
        first_func = func_eq[0][0]
        if first_func.args:
            indep_symbol = (
                indep_symbol if indep_symbol in first_func.args else first_func.args[0]
            )

        vars_str = ",".join(str(arg) for arg in first_func.args)
        funcs_str = ",".join(_unique(_func_name(func) for func, _ in func_eq))

        equations = []
        equations_latex = []
        for func, expr in func_eq:
            lhs = sp.Derivative(func, indep_symbol)
            eq = sp.Eq(lhs, expr)
            equations.append(sp.sstr(eq))
            equations_latex.append(sp.latex(eq))

        example_id = file_path.stem.lower()
        examples[example_id] = ExampleData(
            id=example_id,
            name=_safe_title(file_path.stem),
            description=description.strip(),
            diff_ord=diff_ord,
            first_indep=str(indep_symbol),
            func_eq=func_eq,
            vars=vars_str,
            funcs=funcs_str,
            equations=equations,
            equations_latex=equations_latex,
        )

    return examples


def get_example(example_id: str) -> ExampleData | None:
    examples = load_examples()
    return examples.get(example_id.lower())


def list_examples() -> list[ExampleData]:
    examples = load_examples()
    return list(examples.values())
