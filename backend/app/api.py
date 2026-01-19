from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import ExampleDetail, ExampleSummary, QuadratizeRequest, QuadratizeResponse
from app.services.examples_service import get_example_detail, list_example_summaries
from app.services.quadratize_service import QuadratizeServiceError, quadratize_request

router = APIRouter(prefix="/api")


@router.get("/examples", response_model=list[ExampleSummary])
async def list_examples_endpoint():
    return list_example_summaries()


@router.get("/examples/{example_id}", response_model=ExampleDetail)
async def example_detail_endpoint(example_id: str):
    example = get_example_detail(example_id)
    if example is None:
        raise HTTPException(status_code=404, detail="Example not found.")

    return example


@router.post("/quadratize", response_model=QuadratizeResponse)
async def quadratize_endpoint(payload: QuadratizeRequest):
    try:
        return quadratize_request(payload)
    except QuadratizeServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
