"""
Module 1, Step 5 (persistence): PostgreSQL connection helper.

This gives us one function, get_connection(), that any service can call
to get a database connection with pgvector support enabled.
"""

import psycopg2
from pgvector.psycopg2 import register_vector
from app.config import settings


def get_connection():
    """
    Opens a new connection to PostgreSQL and enables pgvector support
    on it (so we can store/query Python lists as vector columns directly).
    """
    if not settings.DATABASE_URL:
        raise ValueError(
            "DATABASE_URL is not set in .env — add your Supabase/Postgres "
            "connection string there before using the database."
        )

    conn = psycopg2.connect(settings.DATABASE_URL)
    register_vector(conn)
    return conn