"""
GitHub webhook receiver: verifies the signature, and for pull_request
events (opened/synchronize/reopened) kicks off an AI code review in the
background so GitHub doesn't time out waiting for a response.
"""

import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from app.config import settings
from app.services import github_pr_service, code_review_service
from app.db import get_connection

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def verify_signature(payload_body: bytes, signature_header: str) -> bool:
    if not signature_header:
        return False
    expected = "sha256=" + hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode(), payload_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


@router.post("/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    if not verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = request.headers.get("X-GitHub-Event")
    payload = await request.json()

    if event != "pull_request":
        return {"status": "ignored", "reason": f"event {event} not handled"}

    action = payload.get("action")
    if action not in ("opened", "synchronize", "reopened"):
        return {"status": "ignored", "reason": f"action {action} not handled"}

    pr = payload["pull_request"]
    repo_full_name = payload["repository"]["full_name"]  # "owner/repo" — matches pr_reviews.repo_full_name column
    owner, repo = repo_full_name.split("/")
    pr_number = pr["number"]
    commit_sha = pr["head"]["sha"]

    background_tasks.add_task(
        process_pr_review, owner, repo, pr_number, commit_sha, repo_full_name
    )

    return {"status": "accepted"}


async def process_pr_review(owner: str, repo: str, pr_number: int, commit_sha: str, repo_full_name: str):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Idempotency check — don't re-review the same commit twice
            cur.execute(
                "SELECT id FROM pr_reviews WHERE repo_full_name=%s AND pr_number=%s AND commit_sha=%s",
                (repo_full_name, pr_number, commit_sha),
            )
            existing = cur.fetchone()
            if existing:
                return

            # Ownership lives in user_repos, which uses repo_key
            # (that table's schema is unchanged — only pr_reviews uses
            # repo_full_name). Same "owner/repo" string, different column name.
            cur.execute(
                "SELECT user_id FROM user_repos WHERE repo_key=%s ORDER BY last_used_at DESC LIMIT 1",
                (repo_full_name,),
            )
            owner_row = cur.fetchone()
            user_id = owner_row[0] if owner_row else None

            cur.execute(
                """INSERT INTO pr_reviews (user_id, repo_full_name, pr_number, commit_sha, status)
                   VALUES (%s, %s, %s, %s, 'pending') RETURNING id""",
                (user_id, repo_full_name, pr_number, commit_sha),
            )
            review_id = cur.fetchone()[0]
        conn.commit()

        files = await github_pr_service.get_pr_files(owner, repo, pr_number)

        all_comments = []
        with conn.cursor() as cur:
            for f in files:
                if f["status"] == "removed":
                    continue
                patch = f.get("patch", "")
                issues = await code_review_service.review_file_diff(f["filename"], patch)
                for issue in issues:
                    all_comments.append({
                        "path": f["filename"],
                        "line": issue["line"],
                        "body": f"**[{issue['severity'].upper()}]** {issue['comment']}",
                    })
                    cur.execute(
                        """INSERT INTO pr_review_comments (review_id, file_path, line_number, severity, comment)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (review_id, f["filename"], issue["line"], issue["severity"], issue["comment"]),
                    )
        conn.commit()

        if all_comments:
            try:
                await github_pr_service.post_inline_review(owner, repo, pr_number, commit_sha, all_comments)
            except Exception:
                summary = "\n\n".join(f"**{c['path']}**: {c['body']}" for c in all_comments)
                await github_pr_service.post_review_comment(owner, repo, pr_number, summary)

        with conn.cursor() as cur:
            cur.execute(
                "UPDATE pr_reviews SET status='completed', issues_found=%s WHERE id=%s",
                (len(all_comments), review_id),
            )
        conn.commit()

    except Exception as e:
        print("PR_REVIEW ERROR:", repr(e))
        # CRITICAL: roll back first. Without this, the failed query above
        # leaves the transaction "aborted", and this UPDATE would itself
        # raise InFailedSqlTransaction instead of actually running.
        conn.rollback()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE pr_reviews SET status='failed', summary=%s WHERE repo_full_name=%s AND pr_number=%s AND commit_sha=%s",
                (str(e), repo_full_name, pr_number, commit_sha),
            )
        conn.commit()
    finally:
        conn.close()