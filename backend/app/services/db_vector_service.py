"""
Module 1, Step 5: Storing embeddings PERMANENTLY in PostgreSQL (pgvector).

Now includes start_line/end_line so search results and citations can
point to an exact spot in a file, not just the file name.

Note: code_chunks is a SHARED cache across all users — if two different
users index the same public GitHub repo, we don't waste embedding API
calls doing it twice. Per-user "my recent repos" tracking lives in a
separate table (user_repos), added in user_repo_service.py.
"""

from app.db import get_connection


def _to_pg_vector_literal(vector: list) -> str:
    """
    Converts a Python list of floats into the text format pgvector expects.
    We format manually rather than relying on driver auto-conversion,
    since that can sometimes get adapted as a generic array and fail with
    "operator does not exist: vector <-> numeric[]".
    """
    return "[" + ",".join(str(float(x)) for x in vector) + "]"


def save_chunks(repo_key: str, embedded_chunks: list):
    """
    Saves all embedded chunks for a repo into the database, including
    each chunk's line range. Deletes old chunks for this repo first, so
    re-indexing doesn't create duplicates.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            print(f"[db_vector_service] Deleting old chunks for '{repo_key}' (if any)...")
            cur.execute("DELETE FROM code_chunks WHERE repo_key = %s", (repo_key,))

            print(f"[db_vector_service] Inserting {len(embedded_chunks)} new chunks...")
            for chunk in embedded_chunks:
                embedding_literal = _to_pg_vector_literal(chunk["embedding"])
                cur.execute(
                    """
                    INSERT INTO code_chunks
                        (repo_key, file_path, chunk_index, content, embedding, start_line, end_line)
                    VALUES (%s, %s, %s, %s, %s::vector, %s, %s)
                    """,
                    (
                        repo_key,
                        chunk["file_path"],
                        chunk["chunk_index"],
                        chunk["content"],
                        embedding_literal,
                        chunk.get("start_line"),
                        chunk.get("end_line"),
                    ),
                )

        conn.commit()
        print(f"[db_vector_service] Saved {len(embedded_chunks)} chunks for '{repo_key}'.")
    finally:
        conn.close()


def search_similar(repo_key: str, query_vector: list, top_k: int = 5):
    """
    Finds the top_k chunks (for this repo) whose embeddings are closest
    to the query_vector, using pgvector's <-> distance operator.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            query_literal = _to_pg_vector_literal(query_vector)

            cur.execute(
                """
                SELECT file_path, chunk_index, content, start_line, end_line,
                       embedding <-> %s::vector AS distance
                FROM code_chunks
                WHERE repo_key = %s
                ORDER BY embedding <-> %s::vector
                LIMIT %s
                """,
                (query_literal, repo_key, query_literal, top_k),
            )
            rows = cur.fetchall()

        results = []
        for rank, (file_path, chunk_index, content, start_line, end_line, distance) in enumerate(rows):
            results.append({
                "rank": rank + 1,
                "distance": float(distance),
                "file_path": file_path,
                "chunk_index": chunk_index,
                "content": content,
                "start_line": start_line,
                "end_line": end_line,
            })
        return results
    finally:
        conn.close()


def has_repo_indexed(repo_key: str) -> bool:
    """
    Checks whether this repo already has chunks saved in the database.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT EXISTS (SELECT 1 FROM code_chunks WHERE repo_key = %s)",
                (repo_key,),
            )
            (exists,) = cur.fetchone()
        return exists
    finally:
        conn.close()


def list_indexed_repos():
    """
    Returns a list of all distinct repos that have been indexed so far,
    along with how many chunks each one has. Used to build a "recent
    repos" switcher in the UI, so the user doesn't have to retype
    owner/repo/branch for repos they've already indexed.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT repo_key, COUNT(*) as chunk_count
                FROM code_chunks
                GROUP BY repo_key
                ORDER BY repo_key
                """
            )
            rows = cur.fetchall()
        return [{"repo_key": repo_key, "chunk_count": count} for repo_key, count in rows]
    finally:
        conn.close()