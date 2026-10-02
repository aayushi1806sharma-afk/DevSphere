"""
DevSphere backend entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Then visit http://localhost:8000/health
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import repos
from app.api import auth
from app.api import webhooks, reviews
from app.api import bugs
from app.api import analytics


app = FastAPI(title="DevSphere API", version="0.1.0")

# Allow the React frontend (running on a different port) to call this API.
# In production, replace "*" with your actual frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Simple endpoint to confirm the backend is alive and reachable."""
    return {"status": "ok", "service": "DevSphere API"}


@app.get("/")
def root():
    return {"message": "DevSphere backend is running. Try GET /health"}


app.include_router(repos.router, prefix="/api/repos", tags=["repos"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(webhooks.router)
app.include_router(reviews.router)
app.include_router(bugs.router)
app.include_router(analytics.router)

# More routers will be added here as we build further modules:
# from app.api import query, reviews, bugs, analytics
# app.include_router(query.router, prefix="/api/query", tags=["query"])