"""
Feature: User Authentication — database operations for the `users` table.
"""

from app.db import get_connection


def create_user(username: str, password_hash: str, role: str = "team_lead") -> dict:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (username, password_hash, role)
                VALUES (%s, %s, %s)
                RETURNING id, username, role
                """,
                (username, password_hash, role),
            )
            (user_id, username, user_role) = cur.fetchone()
        conn.commit()
        return {"id": user_id, "username": username, "role": user_role}
    finally:
        conn.close()


def get_user_by_username(username: str):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password_hash, COALESCE(role, 'team_lead') FROM users WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()
        if row is None:
            return None
        return {"id": row[0], "username": row[1], "password_hash": row[2], "role": row[3]}
    finally:
        conn.close()


def get_user_by_id(user_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, COALESCE(role, 'team_lead') FROM users WHERE id = %s",
                (user_id,),
            )
            row = cur.fetchone()
        if row is None:
            return None
        return {"id": row[0], "username": row[1], "role": row[2]}
    finally:
        conn.close()


def update_user_role(user_id: int, role: str) -> str:
    """Updates the user's role (e.g. 'developer', 'team_lead', 'admin')."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET role = %s WHERE id = %s RETURNING role",
                (role, user_id),
            )
            row = cur.fetchone()
        conn.commit()
        return row[0] if row else role
    finally:
        conn.close()