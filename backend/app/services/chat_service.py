"""
Feature: Chat history persistence.

Every question + answer gets saved, scoped to (user_id, repo_key), so
refreshing the page or coming back later shows the past conversation
instead of starting blank every time.
"""

import json
from app.db import get_connection


def save_message(user_id: int, repo_key: str, role: str, content: str, sources: list = None):
    """
    role is "user" or "assistant". sources (only for assistant messages)
    is the list of {file_path, chunk_index, ...} dicts, stored as JSON.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages (user_id, repo_key, role, content, sources)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, repo_key, role, content, json.dumps(sources) if sources else None),
            )
        conn.commit()
    finally:
        conn.close()


def get_history(user_id: int, repo_key: str, limit: int = 50):
    """
    Returns this user's past messages for this repo, oldest first (so
    they display in the correct chat order).
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT role, content, sources, created_at
                FROM chat_messages
                WHERE user_id = %s AND repo_key = %s
                ORDER BY created_at ASC
                LIMIT %s
                """,
                (user_id, repo_key, limit),
            )
            rows = cur.fetchall()
        return [
            {
                "role": role,
                "text": content,
                # psycopg2 auto-decodes a JSONB column into a Python list/dict
                # on fetch, so `sources` may already be a list here rather
                # than a JSON string — only call json.loads() when it's
                # still a raw string (e.g. if the column is TEXT instead).
                "sources": json.loads(sources) if isinstance(sources, str) else sources,
                "created_at": str(created_at),
            }
            for role, content, sources, created_at in rows
        ]
    finally:
        conn.close()