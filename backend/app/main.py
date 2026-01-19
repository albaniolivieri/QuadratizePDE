from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="QuadratizePDE API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "QuadratizePDE API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/quadratize")
async def quadratize(equation: dict):
    """
    Endpoint to quadratize a PDE equation.
    This is a placeholder - will be implemented later.
    """
    return {
        "status": "not_implemented",
        "message": "Quadratization endpoint coming soon",
        "received": equation,
    }
