"""
Module 3: Bug Triage Engine — core service logic.

Given a bug report (free text or stack trace), this service:
  1. Retrieves all indexed files for the repository to ground the LLM in real repo files.
  2. Embeds the report using the same embedding model as Module 1.
  3. Retrieves the top-k most similar chunks from pgvector (code chunks + past bugs).
  4. Sends the retrieved context + bug report + known repo files to Gemini.
  5. Parses and strictly validates affected_files against the real repository files,
     ensuring non-existent/external files (e.g. from stack traces or 3rd-party libs)
     are cleanly categorized into external_files rather than falsely claimed as repo files.
  6. Saves the triage result back to the bugs table for future retrieval.
"""

import json
import uuid
import datetime

from app.db import get_connection
from app.services import embedding_service
from app.services import llm_service


def _format_created_at(dt) -> str:
    """
    Ensures timestamp string always includes explicit ISO 8601 timezone (UTC / Z)
    so frontend browsers accurately convert to the user's local timezone.
    """
    if not dt:
        return ""
    if hasattr(dt, "isoformat"):
        iso = dt.isoformat()
        if dt.tzinfo is None:
            return iso + "Z"
        return iso
    s = str(dt).strip()
    if " " in s and "T" not in s:
        s = s.replace(" ", "T")
    if not s.endswith("Z") and "+" not in s and "-" not in s[10:]:
        s += "Z"
    return s


# ============================================================
# BUG TRIAGE SYSTEM PROMPT
# ============================================================

BUG_TRIAGE_SYSTEM = """You are DevSphere's Bug Triage Engine. Given a bug report, \
the list of real files in the repository, and retrieved context (similar past issues \
and code chunks), identify the likely root cause, affected repository files, severity, \
and a suggested fix. Be concise, precise, and strictly grounded in the real repository files."""


# ============================================================
# REPO FILE HELPERS
# ============================================================

def get_repo_indexed_files(repo_key: str) -> list[str]:
    """
    Returns the distinct list of real file paths that were indexed
    for this repository in code_chunks.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT file_path FROM code_chunks WHERE repo_key = %s ORDER BY file_path",
                (repo_key,),
            )
            rows = cur.fetchall()
            return [r[0] for r in rows]
    finally:
        conn.close()


# ============================================================
# PROMPT BUILDER
# ============================================================

def _build_triage_prompt(report_text: str, retrieved_chunks: list, repo_files: list) -> str:
    """
    Builds the full prompt sent to Gemini with explicit repository file grounding.
    """
    repo_files_str = "\n".join(f"- {f}" for f in repo_files) if repo_files else "None (no code files indexed yet)"

    context_sections = []
    for chunk in retrieved_chunks:
        source_label = chunk.get("source_type", "code").upper()
        file_label = chunk.get("file_path", "unknown")

        line_info = ""
        if chunk.get("start_line") and chunk.get("end_line"):
            line_info = f", lines {chunk['start_line']}-{chunk['end_line']}"

        context_sections.append(
            f"--- [{source_label}] {file_label}{line_info} ---\n"
            f"{chunk['content']}"
        )

    context_text = "\n\n".join(context_sections) if context_sections else "No similar context found."

    prompt = (
        f"REPOSITORY FILES IN THIS PROJECT ({len(repo_files)} files total):\n"
        f"{repo_files_str}\n\n"
        f"RETRIEVED CONTEXT (SIMILAR PAST ISSUES & CODE):\n"
        f"{context_text}\n\n"
        f"SUBMITTED BUG REPORT / STACK TRACE:\n"
        f"{report_text}\n\n"
        "STRICT INSTRUCTIONS:\n"
        "1. Identify the likely root cause, severity (Low, Medium, or High), and suggested fix.\n"
        "2. AFFECTED FILES VALIDATION RULE:\n"
        "   - ONLY include a file path in 'affected_files' if it ACTUALLY exists in the 'REPOSITORY FILES IN THIS PROJECT' list above.\n"
        "   - If the stack trace mentions external libraries (e.g. site-packages, python runtime, or frameworks) or files from an external project not in the repository list above, place those in 'external_files'. NEVER put non-existent files into 'affected_files'.\n"
        "   - If none of the repository files are directly involved, set 'affected_files' to [].\n\n"
        "Respond ONLY with a single JSON object — no markdown, no preamble:\n"
        '{"root_cause": "<string>", "severity": "Low|Medium|High", '
        '"affected_files": ["<repo_file_path>", ...], '
        '"external_files": ["<external_lib_or_trace_file>", ...], '
        '"suggested_fix": "<string>"}'
    )
    return prompt


# ============================================================
# PARSE LLM RESPONSE
# ============================================================

def _parse_llm_response(response: str) -> dict:
    """
    Strips any markdown fences Gemini may add and parses the JSON.
    Returns a dict with root_cause, severity, affected_files, external_files, suggested_fix.
    """
    cleaned = response.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[len("```json"):].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "root_cause": "Could not parse LLM response. See raw output.",
            "severity": "Medium",
            "affected_files": [],
            "external_files": [],
            "suggested_fix": cleaned,
        }

    raw_severity = str(data.get("severity", "Medium")).strip().capitalize()
    if raw_severity not in ("Low", "Medium", "High"):
        raw_severity = "Medium"

    return {
        "root_cause": str(data.get("root_cause", "")),
        "severity": raw_severity,
        "affected_files": list(data.get("affected_files", [])),
        "external_files": list(data.get("external_files", [])),
        "suggested_fix": str(data.get("suggested_fix", "")),
    }


# ============================================================
# VALIDATE & CROSS-CHECK AFFECTED FILES AGAINST REAL REPO
# ============================================================

def _validate_and_filter_files(raw_affected: list, raw_external: list, repo_files: list) -> tuple[list, list]:
    """
    Guarantees that 'affected_files' strictly contains files that exist in the repository.
    Any files from the stack trace or LLM output that are not in repo_files are placed
    in 'external_files'.
    """
    repo_file_map = {f.lower().replace("\\", "/"): f for f in repo_files}
    repo_basenames = {}
    for f in repo_files:
        base = f.split("/")[-1].lower()
        repo_basenames.setdefault(base, []).append(f)

    verified_repo_files = []
    external_files = list(raw_external) if raw_external else []

    for item in raw_affected:
        if not item or not isinstance(item, str):
            continue
        cleaned = item.strip().replace("\\", "/").lstrip("./")
        cleaned_lower = cleaned.lower()

        # 1. Exact match (case-insensitive)
        if cleaned_lower in repo_file_map:
            canonical = repo_file_map[cleaned_lower]
            if canonical not in verified_repo_files:
                verified_repo_files.append(canonical)
            continue

        # 2. Suffix match (e.g. LLM says 'services/auth.py' when repo has 'app/services/auth.py')
        suffix_matched = None
        for r_lower, r_actual in repo_file_map.items():
            if r_lower.endswith(cleaned_lower) or cleaned_lower.endswith(r_lower):
                suffix_matched = r_actual
                break
        if suffix_matched:
            if suffix_matched not in verified_repo_files:
                verified_repo_files.append(suffix_matched)
            continue

        # 3. Basename match if unique in repo
        base = cleaned.split("/")[-1].lower()
        if base in repo_basenames and len(repo_basenames[base]) == 1:
            canonical = repo_basenames[base][0]
            if canonical not in verified_repo_files:
                verified_repo_files.append(canonical)
            continue

        # If it doesn't match any file in the repository, it belongs in external_files
        if cleaned not in external_files:
            external_files.append(cleaned)

    return verified_repo_files, external_files


# ============================================================
# DB VECTOR HELPERS (bug-specific)
# ============================================================

def _to_pg_vector_literal(vector: list) -> str:
    return "[" + ",".join(str(float(x)) for x in vector) + "]"


def _search_bugs_and_code(repo_key: str, query_vector: list, top_k: int = 5) -> list:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            query_literal = _to_pg_vector_literal(query_vector)

            # --- code chunks ---
            cur.execute(
                """
                SELECT file_path, chunk_index, content, start_line, end_line,
                       embedding <-> %s::vector AS distance,
                       'code' AS source_type,
                       NULL::text AS bug_id
                FROM code_chunks
                WHERE repo_key = %s
                ORDER BY embedding <-> %s::vector
                LIMIT %s
                """,
                (query_literal, repo_key, query_literal, top_k),
            )
            code_rows = cur.fetchall()

            # --- past bug reports ---
            cur.execute(
                """
                SELECT bug_id::text AS file_path, 0 AS chunk_index,
                       report_text AS content, NULL AS start_line, NULL AS end_line,
                       report_embedding <-> %s::vector AS distance,
                       'bug' AS source_type,
                       bug_id::text AS bug_id
                FROM bugs
                WHERE repo_key = %s
                  AND report_embedding IS NOT NULL
                ORDER BY report_embedding <-> %s::vector
                LIMIT %s
                """,
                (query_literal, repo_key, query_literal, top_k),
            )
            bug_rows = cur.fetchall()

    finally:
        conn.close()

    combined = []
    for file_path, chunk_index, content, start_line, end_line, distance, source_type, bug_id in code_rows:
        combined.append({
            "file_path": file_path,
            "chunk_index": chunk_index,
            "content": content,
            "start_line": start_line,
            "end_line": end_line,
            "distance": float(distance),
            "source_type": source_type,
            "bug_id": bug_id,
        })

    for file_path, chunk_index, content, start_line, end_line, distance, source_type, bug_id in bug_rows:
        combined.append({
            "file_path": f"[past bug] {file_path}",
            "chunk_index": chunk_index,
            "content": content,
            "start_line": start_line,
            "end_line": end_line,
            "distance": float(distance),
            "source_type": source_type,
            "bug_id": bug_id,
        })

    combined.sort(key=lambda x: x["distance"])
    return combined[:top_k]


# ============================================================
# SAVE BUG TO DB
# ============================================================

def save_bug(
    repo_key: str,
    user_id: int,
    report_text: str,
    root_cause: str,
    severity: str,
    affected_files: list,
    external_files: list,
    suggested_fix: str,
    report_embedding: list,
) -> str:
    bug_id = str(uuid.uuid4())
    embedding_literal = _to_pg_vector_literal(report_embedding)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO bugs
                    (bug_id, repo_key, reported_by, report_text,
                     root_cause, severity, affected_files, external_files, suggested_fix,
                     report_embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
                """,
                (
                    bug_id,
                    repo_key,
                    user_id,
                    report_text,
                    root_cause,
                    severity,
                    affected_files,
                    external_files,
                    suggested_fix,
                    embedding_literal,
                ),
            )
        conn.commit()
    finally:
        conn.close()

    return bug_id


# ============================================================
# LIST PAST BUGS
# ============================================================

def list_bugs_for_repo(repo_key: str, user_id: int, limit: int = 50) -> list:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT bug_id, repo_key, report_text, root_cause,
                       severity, affected_files, external_files, suggested_fix, created_at
                FROM bugs
                WHERE repo_key = %s AND reported_by = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (repo_key, user_id, limit),
            )
            rows = cur.fetchall()
        return [
            {
                "bug_id": str(bug_id),
                "repo_key": rkey,
                "report_text": report_text,
                "root_cause": root_cause,
                "severity": severity,
                "affected_files": affected_files or [],
                "external_files": external_files or [],
                "suggested_fix": suggested_fix,
                "created_at": _format_created_at(created_at),
            }
            for bug_id, rkey, report_text, root_cause, severity, affected_files, external_files, suggested_fix, created_at in rows
        ]
    finally:
        conn.close()


# ============================================================
# MAIN ENTRY POINT
# ============================================================

def triage_bug(repo_key: str, user_id: int, report_text: str) -> dict:
    """
    Full triage pipeline:
      1. Fetch real indexed repository files for repo_key
      2. Embed the bug report
      3. Retrieve similar code chunks + past bugs
      4. Call Gemini with grounded diagnosis prompt
      5. Parse and strictly validate affected_files against real repo files
      6. Save and return structured response
    """
    print(f"[bug_triage] Starting triage for repo '{repo_key}'")

    # Step 1 — fetch real repo files
    repo_files = get_repo_indexed_files(repo_key)
    print(f"[bug_triage] Found {len(repo_files)} indexed files in repository '{repo_key}'.")

    # Step 2 — embed the report
    print("[bug_triage] Embedding bug report...")
    report_vector = embedding_service.get_embedding(
        report_text,
        task_type="RETRIEVAL_QUERY",
    )

    # Step 3 — retrieve context
    print("[bug_triage] Searching for similar context...")
    retrieved = _search_bugs_and_code(repo_key, report_vector, top_k=5)
    print(f"[bug_triage] Retrieved {len(retrieved)} context chunks.")

    # Step 4 — build prompt and call LLM
    print("[bug_triage] Calling LLM for diagnosis...")
    prompt = _build_triage_prompt(report_text, retrieved, repo_files)
    raw_response = llm_service.generate_raw(
        prompt=prompt,
        system_instruction=BUG_TRIAGE_SYSTEM,
    )
    print(f"[bug_triage] LLM response received ({len(raw_response)} chars).")

    # Step 5 — parse & validate files against actual repo files
    parsed = _parse_llm_response(raw_response)
    verified_affected, external_files = _validate_and_filter_files(
        parsed["affected_files"],
        parsed.get("external_files", []),
        repo_files
    )

    print(f"[bug_triage] Verified Repo Files: {verified_affected}")
    print(f"[bug_triage] External / Non-repo Files: {external_files}")

    # Step 6 — save result
    print("[bug_triage] Saving triage result to database...")
    save_embedding = embedding_service.get_embedding(
        report_text,
        task_type="RETRIEVAL_DOCUMENT",
    )
    bug_id = save_bug(
        repo_key=repo_key,
        user_id=user_id,
        report_text=report_text,
        root_cause=parsed["root_cause"],
        severity=parsed["severity"],
        affected_files=verified_affected,
        external_files=external_files,
        suggested_fix=parsed["suggested_fix"],
        report_embedding=save_embedding,
    )
    print(f"[bug_triage] Saved as bug_id={bug_id}.")

    # Build similar_past_issues from bug-type chunks only
    similar_past_issues = [
        {
            "bug_id": c["bug_id"],
            "summary": (c["content"][:120] + "…") if len(c["content"]) > 120 else c["content"],
            "score": round(1.0 / (1.0 + c["distance"]), 4),
        }
        for c in retrieved
        if c["source_type"] == "bug" and c["bug_id"]
    ]

    return {
        "bug_id": bug_id,
        "root_cause": parsed["root_cause"],
        "severity": parsed["severity"],
        "affected_files": verified_affected,
        "external_files": external_files,
        "suggested_fix": parsed["suggested_fix"],
        "similar_past_issues": similar_past_issues,
        "created_at": _format_created_at(datetime.datetime.now(datetime.timezone.utc)),
    }
