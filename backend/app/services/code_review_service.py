import json
import asyncio

from app.services.llm_service import generate_raw
from app.config import settings


REVIEW_PROMPT = """You are a senior code reviewer. Review this diff and find real issues only —
bugs, security problems, missed edge cases, bad practices. Do NOT comment on style/formatting
unless it causes a real problem. Be concise.

File: {file_path}

Diff:
{diff}

Respond ONLY with a JSON array, no markdown, no preamble:
[{{"line": <int, line number in NEW file>, "severity": "critical|warning|suggestion", "comment": "<short comment>"}}]

If no issues found, respond with: []
"""


def _truncate_diff(diff: str, max_lines: int) -> str:
    lines = diff.splitlines()

    if len(lines) > max_lines:
        lines = lines[:max_lines] + [
            "... (diff truncated)"
        ]

    return "\n".join(lines)


async def review_file_diff(
    file_path: str,
    diff: str
) -> list[dict]:

    print(
        f"CODE_REVIEW: starting review for {file_path}"
    )

    if not diff:
        print(
            f"CODE_REVIEW: empty diff for {file_path}"
        )
        return []

    # -----------------------------------------
    # TRUNCATE DIFF
    # -----------------------------------------

    diff = _truncate_diff(
        diff,
        settings.MAX_DIFF_LINES_PER_FILE
    )

    print(
        f"CODE_REVIEW: diff prepared for {file_path}"
    )

    prompt = REVIEW_PROMPT.format(
        file_path=file_path,
        diff=diff
    )

    # -----------------------------------------
    # CALL GEMINI
    # -----------------------------------------

    print(
        f"CODE_REVIEW: sending {file_path} to LLM..."
    )

    try:

        response = await asyncio.to_thread(
            generate_raw,
            prompt
        )

    except Exception as e:

        print(
            f"CODE_REVIEW: LLM failed for {file_path}: "
            f"{type(e).__name__}: {e}"
        )

        return []

    # -----------------------------------------
    # RESPONSE RECEIVED
    # -----------------------------------------

    print(
        f"CODE_REVIEW: LLM response received for "
        f"{file_path}"
    )

    print(
        f"CODE_REVIEW: response length = "
        f"{len(response)}"
    )

    print(
        f"CODE_REVIEW: raw response = "
        f"{response[:1000]}"
    )

    # -----------------------------------------
    # CLEAN RESPONSE
    # -----------------------------------------

    cleaned = response.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[len("```json"):].strip()

    elif cleaned.startswith("```"):
        cleaned = cleaned[len("```"):].strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    print(
        f"CODE_REVIEW: cleaned response = "
        f"{cleaned[:1000]}"
    )

    # -----------------------------------------
    # PARSE JSON
    # -----------------------------------------

    print(
        f"CODE_REVIEW: parsing JSON for {file_path}..."
    )

    try:

        issues = json.loads(cleaned)

    except json.JSONDecodeError as e:

        print(
            f"CODE_REVIEW: JSON parsing failed for "
            f"{file_path}"
        )

        print(
            f"CODE_REVIEW: JSON error = {e}"
        )

        print(
            f"CODE_REVIEW: invalid response = "
            f"{cleaned[:1000]}"
        )

        return []

    # -----------------------------------------
    # VALIDATE RESULT
    # -----------------------------------------

    if not isinstance(issues, list):

        print(
            f"CODE_REVIEW: expected JSON list but got "
            f"{type(issues).__name__} for {file_path}"
        )

        return []

    print(
        f"CODE_REVIEW: JSON parsed successfully for "
        f"{file_path}. Issues found: {len(issues)}"
    )

    return issues