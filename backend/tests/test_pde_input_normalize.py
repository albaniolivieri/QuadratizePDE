from __future__ import annotations

import pytest

from app.pde_input_normalize import PdeInputNormalizeError, normalize_custom_equations


def test_latex_second_order_spatial_in_leibniz_notation():
    """SymPy parse_latex mishandles \\partial^2/\\partial x^2 unless rewritten first."""
    latex = (
        r"\frac{\partial u(t,x)}{\partial t} = \frac{\partial^2 u(t,x)}{\partial x^2} "
        r"+ u(t,x) - u(t,x)^3"
    )
    eqs, vars_csv = normalize_custom_equations([latex], "latex", "t,x", "u")
    assert vars_csv == "t,x"
    assert "Derivative(u(t, x), (x, 2))" in eqs[0]


def test_latex_orders_vars_by_lhs_derivative_and_canonicalizes_u():
    latex = r"\frac{\partial u(x,t)}{\partial t} = u(x,t)^{12}"
    eqs, vars_csv = normalize_custom_equations(
        [latex],
        "latex",
        "x,t",
        "u",
    )
    assert vars_csv == "t,x"
    assert len(eqs) == 1
    assert "u(t, x)" in eqs[0] or "u(t,x)" in eqs[0].replace(" ", "")
    assert "Derivative(u(t, x), t)" in eqs[0] or "Derivative(u(t,x), t)" in eqs[0].replace(" ", "")


def test_sympy_permuted_vars_and_u_args():
    line = "Derivative(u(x, t), t) = u(x, t)**12"
    eqs, vars_csv = normalize_custom_equations(
        [line],
        "sympy",
        "t,x",
        "u",
    )
    assert vars_csv == "t,x"
    assert "u(t, x)" in eqs[0] or "u(t,x)" in eqs[0].replace(" ", "")


def test_mathematica_d_bracket_form():
    line = "D[u[x,t],t] == u[x,t]^12"
    eqs, vars_csv = normalize_custom_equations(
        [line],
        "mathematica",
        "x,t",
        "u",
    )
    assert vars_csv == "t,x"
    assert "u(t, x)**12" in eqs[0] or "u(t,x)**12" in eqs[0].replace(" ", "")


def test_second_equation_must_match_evolution_variable():
    with pytest.raises(PdeInputNormalizeError, match="same evolution variable"):
        normalize_custom_equations(
            [
                "Derivative(u(x, t), t) = 0",
                "Derivative(u(x, t), x) = 0",
            ],
            "sympy",
            "x,t",
            "u",
        )
