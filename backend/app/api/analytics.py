"""
Module 4: Team Analytics Dashboard API endpoints.

GET   /api/analytics                       — get aggregated team analytics for repo_key
GET   /api/analytics/{repo_owner}/{repo_name} — get aggregated team analytics (path param)
PATCH /api/analytics/bugs/{bug_id}/status  — toggle bug status ('open' / 'resolved')
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from app.dependencies import require_team_lead_or_admin
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("")
def get_analytics_by_query(
    repo_key: str = Query(..., description="Repository key, e.g. owner/repo"),
    period: str = Query("7d", description="Time period: 7d or 30d"),
    current_user: dict = Depends(require_team_lead_or_admin),
):
    """
    FR-1 → FR-7: Aggregated team analytics dashboard metrics for Team Leads & Admins.
    Live computed from pr_reviews (Module 2) and bugs (Module 3) with an
    AI-generated weekly summary from Gemini.
    """
    clean_repo = repo_key.strip()
    if not clean_repo or "/" not in clean_repo:
        raise HTTPException(
            status_code=400,
            detail="repo_key query parameter must be in 'owner/repo' format.",
        )

    try:
        data = analytics_service.get_team_analytics(repo_key=clean_repo, period=period)
        return data
    except Exception as e:
        print(f"ANALYTICS ERROR: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate team analytics: {e}",
        )


@router.get("/{repo_owner}/{repo_name}")
def get_analytics_by_path(
    repo_owner: str,
    repo_name: str,
    period: str = Query("7d", description="Time period: 7d or 30d"),
    current_user: dict = Depends(require_team_lead_or_admin),
):
    """Path param variant matching convention: GET /api/analytics/{repo_id}?period=7d"""
    repo_key = f"{repo_owner}/{repo_name}"
    try:
        data = analytics_service.get_team_analytics(repo_key=repo_key, period=period)
        return data
    except Exception as e:
        print(f"ANALYTICS ERROR: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate team analytics: {e}",
        )


class BugStatusUpdate(BaseModel):
    status: str


@router.patch("/bugs/{bug_id}/status")
def update_bug_status(
    bug_id: str,
    body: BugStatusUpdate,
    current_user: dict = Depends(require_team_lead_or_admin),
):
    """Allows Team Leads to mark bugs as resolved or reopen them."""
    try:
        updated = analytics_service.set_bug_status(bug_id, body.status)
        return updated
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bug status: {e}")
