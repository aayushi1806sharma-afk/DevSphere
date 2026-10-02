import httpx
from app.config import settings

GITHUB_API = "https://api.github.com"

def _headers():
    return {
        "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

async def get_pr_files(owner: str, repo: str, pr_number: int) -> list[dict]:
    """Returns list of changed files with their diff patches."""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}/files"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=_headers(), params={"per_page": 100})
        resp.raise_for_status()
        return resp.json()

async def post_review_comment(owner: str, repo: str, pr_number: int, body: str):
    """Posts a single summary comment on the PR (issue comments endpoint)."""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/issues/{pr_number}/comments"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=_headers(), json={"body": body})
        resp.raise_for_status()
        return resp.json()

async def post_inline_review(owner: str, repo: str, pr_number: int, commit_sha: str, comments: list[dict]):
    """
    Posts a full review with inline comments.
    comments: [{"path": "file.py", "line": 45, "body": "..."}]
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}/reviews"
    payload = {
        "commit_id": commit_sha,
        "event": "COMMENT",
        "comments": comments,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()