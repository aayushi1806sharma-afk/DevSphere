"""
Module 1, Step 5 (final RAG piece): Generating a natural-language answer
using Gemini's chat model, grounded in the code chunks retrieved from FAISS.

Module 2 also uses this file through generate_raw() for AI code review.
"""

import time

from google import genai
from google.genai.types import GenerateContentConfig

from app.config import settings


# ============================================================
# GEMINI CLIENT
# ============================================================

_client = None


def _get_client():
    global _client

    if _client is None:
        if not settings.LLM_API_KEY:
            raise ValueError(
                "LLM_API_KEY is not set in .env — add your Gemini API key there "
                "before using the LLM."
            )

        _client = genai.Client(
            api_key=settings.LLM_API_KEY
        )

    return _client


# ============================================================
# MODELS
# ============================================================

CHAT_MODEL = "gemini-3.6-flash"
FALLBACK_MODEL = "gemini-2.5-flash"


# ============================================================
# RAG SYSTEM INSTRUCTION
# ============================================================

SYSTEM_INSTRUCTION = """You are DevSphere, an AI assistant that helps developers
understand a codebase. You will be given some CODE CONTEXT (chunks of real code
from the repository) and a QUESTION from a developer.

Rules you must follow:

1. Answer ONLY using the information in the CODE CONTEXT provided below.

2. If the CODE CONTEXT does not contain enough information to answer the
   question, say clearly:
   "I don't have enough information in the indexed code to answer that."

3. Do NOT guess or make up code that wasn't shown to you.

4. When relevant, mention which file(s) your answer is based on.

5. Keep the answer concise and developer-friendly.
"""


# ============================================================
# BUILD RAG PROMPT
# ============================================================

def build_prompt(question: str, retrieved_chunks: list) -> str:
    context_sections = []

    for chunk in retrieved_chunks:

        line_info = ""

        if chunk.get("start_line") and chunk.get("end_line"):
            line_info = (
                f", lines {chunk['start_line']}-{chunk['end_line']}"
            )

        context_sections.append(
            f"--- File: {chunk['file_path']}{line_info} ---\n"
            f"{chunk['content']}"
        )

    context_text = "\n\n".join(context_sections)

    prompt = (
        f"CODE CONTEXT:\n"
        f"{context_text}\n\n"
        f"QUESTION:\n"
        f"{question}\n\n"
        f"Answer the question using only the CODE CONTEXT above."
    )

    return prompt


# ============================================================
# RETRY CHECK
# ============================================================

def _is_retryable(error: Exception) -> bool:

    if error is None:
        return False

    message = str(error)

    return (
        "503" in message
        or "UNAVAILABLE" in message
        or "429" in message
        or "RESOURCE_EXHAUSTED" in message
    )


# ============================================================
# SINGLE GEMINI CALL
# ============================================================

def _call_model(
    model_name: str,
    prompt: str,
    system_instruction: str = None,
) -> str:

    print(
        f"LLM_SERVICE: calling {model_name}..."
    )

    response = _get_client().models.generate_content(
        model=model_name,
        contents=prompt,
        config=GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
        ),
    )

    print(
        f"LLM_SERVICE: {model_name} response received."
    )

    return response.text


# ============================================================
# COMMON GENERATION + FALLBACK LOGIC
# ============================================================

def _generate_with_fallback(
    prompt: str,
    system_instruction: str = None,
    max_retries: int = 3,
) -> str:

    last_error = None

    # --------------------------------------------------------
    # PRIMARY MODEL
    # --------------------------------------------------------

    for attempt in range(max_retries):

        try:

            return _call_model(
                CHAT_MODEL,
                prompt,
                system_instruction,
            )

        except Exception as e:

            last_error = e

            print(
                f"LLM_SERVICE: {CHAT_MODEL} failed: "
                f"{type(e).__name__}: {e}"
            )

            if (
                _is_retryable(e)
                and attempt < max_retries - 1
            ):

                wait_time = 2 ** attempt

                print(
                    f"LLM_SERVICE: {CHAT_MODEL} retry "
                    f"{attempt + 1}/{max_retries} "
                    f"in {wait_time}s..."
                )

                time.sleep(wait_time)

                continue

            break

    # --------------------------------------------------------
    # FALLBACK MODEL
    # --------------------------------------------------------

    if _is_retryable(last_error):

        print(
            f"LLM_SERVICE: {CHAT_MODEL} still unavailable. "
            f"Falling back to {FALLBACK_MODEL}..."
        )

        try:

            return _call_model(
                FALLBACK_MODEL,
                prompt,
                system_instruction,
            )

        except Exception as e:

            last_error = e

            print(
                f"LLM_SERVICE: {FALLBACK_MODEL} failed: "
                f"{type(e).__name__}: {e}"
            )

    # --------------------------------------------------------
    # FINAL ERROR
    # --------------------------------------------------------

    raise last_error


# ============================================================
# MODULE 1 — RAG ANSWER
# ============================================================

def generate_answer(
    question: str,
    retrieved_chunks: list,
    max_retries: int = 3,
) -> str:

    if not retrieved_chunks:

        return (
            "I don't have enough information in the indexed code "
            "to answer that."
        )

    prompt = build_prompt(
        question,
        retrieved_chunks,
    )

    return _generate_with_fallback(
        prompt=prompt,
        system_instruction=SYSTEM_INSTRUCTION,
        max_retries=max_retries,
    )


# ============================================================
# MODULE 2 — AI CODE REVIEW
# ============================================================

def generate_raw(
    prompt: str,
    system_instruction: str = None,
    max_retries: int = 3,
) -> str:

    """
    Generic Gemini completion used by AI code review.

    Unlike generate_answer(), this function does not build
    the RAG prompt. It directly sends the supplied prompt
    to Gemini.
    """

    return _generate_with_fallback(
        prompt=prompt,
        system_instruction=system_instruction,
        max_retries=max_retries,
    )