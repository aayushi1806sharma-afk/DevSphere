"""
Feature: per-user "recent repos" tracking.

code_chunks (the embeddings) are SHARED across all users to avoid
re-indexing the same public repo twice. But each user's sidebar should
only show the repos THEY chose to index — that's what this table does.
"""

from app.db import get_connection


def record_user_repo(user_id: int, repo_key: str):
    """
    Marks that this user has indexed/used this repo. If they already
    had it, just updates the timestamp (so it moves to the top as "recent").
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO user_repos (user_id, repo_key, last_used_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id, repo_key)
                DO UPDATE SET last_used_at = NOW()
                """,
                (user_id, repo_key),
            )
        conn.commit()
    finally:
        conn.close()


def list_user_repos(user_id: int):
    """
    Returns this user's repos, most recently used first, along with how
    many chunks each has (joined from the shared code_chunks table).
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ur.repo_key, ur.last_used_at, COUNT(cc.id) as chunk_count
                FROM user_repos ur
                LEFT JOIN code_chunks cc ON cc.repo_key = ur.repo_key
                WHERE ur.user_id = %s
                GROUP BY ur.repo_key, ur.last_used_at
                ORDER BY ur.last_used_at DESC
                """,
                (user_id,),
            )
            rows = cur.fetchall()
        return [
            {"repo_key": repo_key, "last_used_at": str(last_used), "chunk_count": count}
            for repo_key, last_used, count in rows
        ]
    finally:
        conn.close()