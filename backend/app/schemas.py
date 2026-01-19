from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class ExampleSummary(BaseModel):
    id: str
    name: str
    description: str
    diff_ord: int
    first_indep: str
    equations_latex: list[str] = Field(default_factory=list)


class ExampleDetail(ExampleSummary):
    equations: list[str] = Field(default_factory=list)
    vars: str
    funcs: str


class QuadratizeRequest(BaseModel):
    mode: Literal["example", "custom"]
    example_id: Optional[str] = None
    equations: Optional[list[str]] = None
    vars: Optional[str] = None
    funcs: Optional[str] = None
    format: Literal["sympy", "mathematica"] = "sympy"
    diff_ord: int = 2
    search_alg: Literal["bnb", "inn"] = "bnb"
    sort_fun: Literal["by_fun", "by_degree_order", "by_order_degree"] = "by_fun"
    max_der_order: int = 2
    nvars_bound: int = 10
    show_nodes: bool = False

    @model_validator(mode="after")
    def validate_payload(self) -> "QuadratizeRequest":
        if self.mode == "example":
            if not self.example_id:
                raise ValueError("example_id is required.")
        else:
            if not self.equations or not self.vars or not self.funcs:
                raise ValueError("equations, vars, and funcs are required for custom mode.")
        return self


class LatexOutput(BaseModel):
    aux_vars: list[str] = Field(default_factory=list)
    frac_vars: list[str] = Field(default_factory=list)
    quad_sys: list[str] = Field(default_factory=list)


class QuadratizeResponse(BaseModel):
    aux_vars: list[str] = Field(default_factory=list)
    frac_vars: list[str] = Field(default_factory=list)
    quad_sys: list[str] = Field(default_factory=list)
    traversed: Optional[int] = None
    latex_output: LatexOutput = Field(default_factory=LatexOutput)
