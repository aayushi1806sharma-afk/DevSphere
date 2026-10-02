"""
Module 1, Step 3: Converting text into embeddings using Gemini's embedding API.

An embedding is just a list of numbers (a "vector") that represents the
MEANING of a piece of text. Texts with similar meaning end up with similar
vectors — that's what lets us later search "which code chunk is most
relevant to this question?" using math instead of exact keyword matching.

No vector database yet (that's the next step, using FAISS) — this file's
only job is: given some text, return its embedding vector.

Note: we use the newer `google-genai` package (not the older, now-deprecated
`google-generativeai` package).
"""

from google import genai
from google.genai.types import EmbedContentConfig
from app.config import settings

# We create the client lazily (only when first needed), not at import time.
# This way, the whole backend doesn't crash on startup just because the
# embedding feature hasn't been configured with an API key yet.
_client = None


def _get_client():
    global _client
    if _client is None:
        if not settings.LLM_API_KEY:
            raise ValueError(
                "LLM_API_KEY is not set in .env — add your Gemini API key there "
                "before using embeddings."
            )
        _client = genai.Client(api_key=settings.LLM_API_KEY)
    return _client


# Gemini's embedding model. 3072-dimension vectors by default.
EMBEDDING_MODEL = "gemini-embedding-001"


def get_embedding(text: str, task_type: str = "RETRIEVAL_DOCUMENT"):
    """
    Converts a single piece of text into an embedding vector.

    task_type matters for quality:
    - "RETRIEVAL_DOCUMENT" -> use this for the code CHUNKS we're storing
    - "RETRIEVAL_QUERY"    -> use this for the user's QUESTION when searching
    Gemini optimizes the vector slightly differently depending on which
    side of the search you're embedding.
    """
    if not text or not text.strip():
        raise ValueError("Cannot create an embedding for empty text.")

    response = _get_client().models.embed_content(
        model=EMBEDDING_MODEL,
        contents=[text],
        config=EmbedContentConfig(task_type=task_type),
    )
    return response.embeddings[0].values  # a list of floats, e.g. 768 numbers


def get_embeddings_for_chunks(chunks: list):
    """
    Takes the list of chunk dicts from chunking_service.chunk_files()
    and adds an "embedding" field to each one.

    We do this one at a time (not batched) to keep this beginner-friendly
    and easy to debug — we can optimize with batching later if needed.
    """
    embedded_chunks = []

    for i, chunk in enumerate(chunks):
        print(f"[embedding_service] Embedding chunk {i + 1}/{len(chunks)} "
              f"({chunk['file_path']} #{chunk['chunk_index']})...")

        vector = get_embedding(chunk["content"], task_type="RETRIEVAL_DOCUMENT")

        embedded_chunks.append({
            **chunk,
            "embedding": vector,
        })

    print(f"[embedding_service] Done. Embedded {len(embedded_chunks)} chunks.")
    return embedded_chunks