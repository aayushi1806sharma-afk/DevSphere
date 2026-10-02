"""
Module 1, Step 4: Storing embeddings in a FAISS index and searching them.

FAISS is a library that takes a bunch of vectors and lets you quickly find
which ones are "closest" (most similar in meaning) to a new vector.

Important: FAISS only stores the numbers (vectors). It does NOT remember
which chunk of code each vector came from. So alongside the FAISS index,
we keep a plain Python list called `metadata` — position 0 in that list
describes vector 0 in the index, position 1 describes vector 1, and so on.

For now, we keep everything in memory (a Python dictionary), keyed by
"owner/repo". This means the index disappears if the server restarts —
that's fine for this testing step. Persisting it properly comes later
when we move to a real database (pgvector).
"""

import numpy as np
import faiss

# In-memory storage: { "owner/repo": {"index": faiss_index, "metadata": [...]} }
_repo_indexes = {}


def build_index(repo_key: str, embedded_chunks: list):
    """
    Takes a list of chunks (each with an "embedding" field already filled in)
    and builds a FAISS index from them, storing it in memory under repo_key.
    """
    if not embedded_chunks:
        raise ValueError("No embedded chunks provided to build an index from.")

    vectors = np.array([chunk["embedding"] for chunk in embedded_chunks]).astype("float32")
    vector_size = vectors.shape[1]

    # IndexFlatL2 = the simplest FAISS index: compares vectors using plain
    # straight-line ("Euclidean") distance. Not the fastest for huge datasets,
    # but simple, exact, and totally fine for a student project's repo sizes.
    index = faiss.IndexFlatL2(vector_size)
    index.add(vectors)

    metadata = [
        {
            "file_path": chunk["file_path"],
            "chunk_index": chunk["chunk_index"],
            "content": chunk["content"],
        }
        for chunk in embedded_chunks
    ]

    _repo_indexes[repo_key] = {"index": index, "metadata": metadata}

    print(f"[vector_store_service] Built FAISS index for '{repo_key}' "
          f"with {len(embedded_chunks)} vectors of size {vector_size}.")

    return {"num_vectors": len(embedded_chunks), "vector_size": vector_size}


def search_index(repo_key: str, query_vector: list, top_k: int = 3):
    """
    Given a query embedding, finds the top_k most similar chunks
    from the previously built index for this repo.
    """
    if repo_key not in _repo_indexes:
        raise ValueError(
            f"No index found for '{repo_key}'. Build one first using /build-index."
        )

    index = _repo_indexes[repo_key]["index"]
    metadata = _repo_indexes[repo_key]["metadata"]

    query = np.array([query_vector]).astype("float32")

    distances, indices = index.search(query, top_k)

    results = []
    for rank, (distance, idx) in enumerate(zip(distances[0], indices[0])):
        if idx == -1:
            continue
        results.append({
            "rank": rank + 1,
            "distance": float(distance),
            "file_path": metadata[idx]["file_path"],
            "chunk_index": metadata[idx]["chunk_index"],
            "content": metadata[idx]["content"],
        })

    return results


def has_index(repo_key: str) -> bool:
    return repo_key in _repo_indexes