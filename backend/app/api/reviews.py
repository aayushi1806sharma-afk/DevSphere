from fastapi import APIRouter, HTTPException, Depends
from app.db import get_connection
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("")
def list_reviews(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM pr_reviews WHERE user_id=%s ORDER BY created_at DESC",
                (current_user["id"],),
            )
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()


@router.get("/{repo_owner}/{repo_name}/{pr_number}")
def get_review(repo_owner: str, repo_name: str, pr_number: int, current_user: dict = Depends(get_current_user)):
    repo_full_name = f"{repo_owner}/{repo_name}"
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM pr_reviews WHERE repo_full_name=%s AND pr_number=%s ORDER BY created_at DESC LIMIT 1",
                (repo_full_name, pr_number),
            )
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()

            if not row:
                raise HTTPException(404, "No review found")

            review = dict(zip(columns, row))

            # NEW: also fetch the individual issues for this review,
            # so the UI can show each one instead of just the summary count.
            cur.execute(
                "SELECT file_path, line_number, severity, comment FROM pr_review_comments WHERE review_id=%s ORDER BY line_number",
                (review["id"],),
            )
            issue_columns = [desc[0] for desc in cur.description]
            issue_rows = cur.fetchall()
            review["issues"] = [dict(zip(issue_columns, r)) for r in issue_rows]

        return review
    finally:
        conn.close()