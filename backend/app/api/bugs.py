"""
Module 3: Bug Triage API endpoints.

POST /api/bugs/triage  — run triage on a submitted bug report
GET  /api/bugs         — list past triage results for a given repo
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator

from app.dependencies import get_current_user
from app.services import bug_triage_service
from app.services import db_vector_service

router = APIRouter(prefix="/api/bugs", tags=["bugs"])


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class TriageRequest(BaseModel):
    repo_key: str   # e.g. "owner/repo"  (same format used everywhere in Module 1)
    report_text: str

    @field_validator("repo_key", "report_text")
    @classmethod
    def not_blank(cls, value: str, info):
        cleaned = value.strip()
        if not cleaned:
            raise ValueError(f"'{info.field_name}' cannot be empty.")
        return cleaned


# ============================================================
# POST /api/bugs/triage
# ============================================================

@router.post("/triage")
def triage_bug(
    request: TriageRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    FR-1 → FR-7: receive a bug report, run RAG-based diagnosis,
    persist the result, and return a structured card payload.

    The repo must already be indexed (build-index called at least once)
    so there are code chunks to search against. Past bug reports for the
    same repo are also searched automatically by the service layer.
    """
    print(
        f"BUGS/TRIAGE: repo='{request.repo_key}' "
        f"user={current_user['id']}"
    )

    # Guard: require the repo to be indexed before triage
    # (same pattern as /api/repos/ask in Module 1)
    if not db_vector_service.has_repo_indexed(request.repo_key):
        raise HTTPException(
            status_code=400,
            detail=(
                f"No code index found for '{request.repo_key}'. "
                "Please index the repository first using the Codebase Intelligence tab."
            ),
        )

    try:
        result = bug_triage_service.triage_bug(
            repo_key=request.repo_key,
            user_id=current_user["id"],
            report_text=request.report_text,
        )
    except Exception as e:
        print(f"BUGS/TRIAGE ERROR: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Triage failed: {e}",
        )

    return result


# ============================================================
# GET /api/bugs
# ============================================================

@router.get("")
def list_bugs(
    repo_key: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns this user's past triage results for a given repo,
    most-recent first.  The frontend uses this to render the
    history sidebar / list on the Bug Triage page.
    """
    if not repo_key or not repo_key.strip():
        raise HTTPException(status_code=400, detail="repo_key query param is required.")

    try:
        bugs = bug_triage_service.list_bugs_for_repo(
            repo_key=repo_key.strip(),
            user_id=current_user["id"],
        )
    except Exception as e:
        print(f"BUGS/LIST ERROR: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch bug history: {e}",
        )

    return {"repo_key": repo_key, "bugs": bugs}
