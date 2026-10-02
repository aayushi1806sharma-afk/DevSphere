"""
Module 1: Repository API endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator

from app.services import github_service
from app.services.chunking_service import chunk_files
from app.services import embedding_service
from app.services import llm_service
from app.services import db_vector_service
from app.services import chat_service
from app.services import user_repo_service
from app.dependencies import get_current_user

router = APIRouter()


class RepoPreviewRequest(BaseModel):
    owner: str
    repo: str
    branch: str = "main"

    @field_validator("owner", "repo")
    @classmethod
    def not_blank(cls, value: str, info):
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(f"'{info.field_name}' cannot be empty.")

        return cleaned

    @field_validator("branch")
    @classmethod
    def default_if_blank(cls, value: str):
        cleaned = value.strip()
        return cleaned if cleaned else "main"


@router.post("/preview")
def preview_repo(request: RepoPreviewRequest):
    print("PREVIEW: reading repository...")

    try:
        files = github_service.read_repository(
            owner=request.owner,
            repo=request.repo,
            branch=request.branch,
        )

        print("PREVIEW: repository read complete")
        print("PREVIEW FILES:", len(files))

    except Exception as e:
        print("PREVIEW ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=f"Could not read repo: {e}",
        )

    return {
        "repo": f"{request.owner}/{request.repo}",
        "files_found": len(files),
        "preview": [
            {
                "path": f["path"],
                "content_snippet": f["content"][:200],
            }
            for f in files
        ],
    }


@router.post("/chunk-preview")
def chunk_preview(request: RepoPreviewRequest):
    print("STEP 1: chunk-preview started")

    try:
        print("STEP 2: reading repository...")

        files = github_service.read_repository(
            owner=request.owner,
            repo=request.repo,
            branch=request.branch,
        )

        print("STEP 3: repository read complete")
        print("FILES FOUND:", len(files))

    except Exception as e:
        print("ERROR WHILE READING REPO:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=f"Could not read repo: {e}",
        )

    print("STEP 4: starting chunking...")

    all_chunks = chunk_files(files)

    print("STEP 5: chunking complete")
    print("TOTAL CHUNKS:", len(all_chunks))

    chunks_per_file = {}

    for chunk in all_chunks:
        file_path = chunk["file_path"]
        chunks_per_file[file_path] = (
            chunks_per_file.get(file_path, 0) + 1
        )

    print("STEP 6: preparing response")

    return {
        "repo": f"{request.owner}/{request.repo}",
        "files_found": len(files),
        "total_chunks": len(all_chunks),
        "chunks_per_file": chunks_per_file,
        "sample_chunks": [
            {
                "file_path": chunk["file_path"],
                "chunk_index": chunk["chunk_index"],
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
                "content_snippet": chunk["content"][:200],
            }
            for chunk in all_chunks[:3]
        ],
    }


@router.post("/embed-preview")
def embed_preview(request: RepoPreviewRequest):
    print("STEP 1: embed-preview started")

    try:
        print("STEP 2: reading repository...")

        files = github_service.read_repository(
            owner=request.owner,
            repo=request.repo,
            branch=request.branch,
        )

        print("STEP 3: repository read complete")
        print("FILES FOUND:", len(files))

    except Exception as e:
        print("ERROR WHILE READING REPO:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=f"Could not read repo: {e}",
        )

    print("STEP 4: starting chunking...")

    all_chunks = chunk_files(files)

    print("STEP 5: chunking complete")
    print("TOTAL CHUNKS AVAILABLE:", len(all_chunks))

    sample_size = 3
    sample = all_chunks[:sample_size]

    print(
        f"STEP 6: embedding a sample of {len(sample)} chunks..."
    )

    try:
        embedded = embedding_service.get_embeddings_for_chunks(sample)

        print("STEP 7: embedding complete")
        print("CHUNKS EMBEDDED:", len(embedded))

    except Exception as e:
        print("ERROR WHILE EMBEDDING:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=f"Embedding failed: {e}",
        )

    print("STEP 8: preparing response")

    return {
        "repo": f"{request.owner}/{request.repo}",
        "total_chunks_available": len(all_chunks),
        "chunks_embedded_in_this_test": len(embedded),
        "sample_results": [
            {
                "file_path": e["file_path"],
                "chunk_index": e["chunk_index"],
                "embedding_length": len(e["embedding"]),
                "embedding_preview": e["embedding"][:5],
            }
            for e in embedded
        ],
    }


@router.post("/build-index")
def build_index(request: RepoPreviewRequest, current_user: dict = Depends(get_current_user)):
    """
    Module 1, Step 5:

    Reads the repository, chunks it, embeds all chunks,
    and saves them to PostgreSQL with pgvector so they
    persist even after a server restart.
    """

    print("STEP 1: build-index started")

    try:
        print("STEP 2: reading repository...")

        files = github_service.read_repository(
            owner=request.owner,
            repo=request.repo,
            branch=request.branch,
        )

        print("STEP 3: repository read complete")
        print("FILES FOUND:", len(files))

    except Exception as e:
        print("ERROR WHILE READING REPO:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=f"Could not read repo: {e}",
        )

    print("STEP 4: starting chunking...")

    all_chunks = chunk_files(files)

    print("STEP 5: chunking complete")
    print("TOTAL CHUNKS:", len(all_chunks))

    print(
        f"STEP 6: embedding ALL {len(all_chunks)} chunks "
        "(this may take a bit)..."
    )

    try:
        embedded = embedding_service.get_embeddings_for_chunks(
            all_chunks
        )

        print("STEP 7: embedding complete")

    except Exception as e:
        print("ERROR WHILE EMBEDDING:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=f"Embedding failed: {e}",
        )

    print(
        "STEP 8: saving chunks + embeddings "
        "to PostgreSQL (pgvector)..."
    )

    repo_key = f"{request.owner}/{request.repo}"

    try:
        db_vector_service.save_chunks(
            repo_key,
            embedded,
        )

        print("STEP 9: saved successfully")

    except Exception as e:
        print("ERROR WHILE SAVING TO DATABASE:", repr(e))
        raise HTTPException(
            status_code=400,
            detail=f"Saving to database failed: {e}",
        )

    user_repo_service.record_user_repo(current_user["id"], repo_key)

    return {
        "repo": repo_key,
        "chunks_embedded": len(embedded),
        "chunks_saved": len(embedded),
        "message": (
            "Index built and saved to PostgreSQL. "
            "You can now use POST /api/repos/search to query it "
            "— even after a restart."
        ),
    }


class RepoSearchRequest(BaseModel):
    owner: str
    repo: str
    question: str
    top_k: int = 3

    @field_validator("owner", "repo", "question")
    @classmethod
    def not_blank(cls, value: str, info):
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(f"'{info.field_name}' cannot be empty.")

        return cleaned


@router.post("/search")
def search_repo(request: RepoSearchRequest, current_user: dict = Depends(get_current_user)):
    repo_key = f"{request.owner}/{request.repo}"

    if not db_vector_service.has_repo_indexed(repo_key):
        raise HTTPException(
            status_code=400,
            detail=(
                f"No index found for '{repo_key}'. "
                "Call /api/repos/build-index first."
            ),
        )

    print(
        f"SEARCH: embedding question: "
        f"{request.question!r}"
    )

    try:
        query_vector = embedding_service.get_embedding(
            request.question,
            task_type="RETRIEVAL_QUERY",
        )

    except Exception as e:
        print(
            "ERROR WHILE EMBEDDING QUESTION:",
            repr(e),
        )

        raise HTTPException(
            status_code=400,
            detail=f"Embedding question failed: {e}",
        )

    results = db_vector_service.search_similar(
        repo_key,
        query_vector,
        top_k=request.top_k,
    )

    return {
        "repo": repo_key,
        "question": request.question,
        "results": results,
    }


class AskRequest(BaseModel):
    owner: str
    repo: str
    question: str
    top_k: int = 5

    @field_validator("owner", "repo", "question")
    @classmethod
    def not_blank(cls, value: str, info):
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(f"'{info.field_name}' cannot be empty.")

        return cleaned


@router.post("/ask")
def ask_repo(request: AskRequest, current_user: dict = Depends(get_current_user)):
    repo_key = f"{request.owner}/{request.repo}"

    if not db_vector_service.has_repo_indexed(repo_key):
        raise HTTPException(
            status_code=400,
            detail=(
                f"No index found for '{repo_key}'. "
                "Call /api/repos/build-index first."
            ),
        )

    print(
        f"ASK: embedding question: "
        f"{request.question!r}"
    )

    try:
        query_vector = embedding_service.get_embedding(
            request.question,
            task_type="RETRIEVAL_QUERY",
        )

    except Exception as e:
        print(
            "ERROR WHILE EMBEDDING QUESTION:",
            repr(e),
        )

        raise HTTPException(
            status_code=400,
            detail=f"Embedding question failed: {e}",
        )

    print(
        "ASK: searching pgvector for relevant chunks..."
    )

    retrieved_chunks = db_vector_service.search_similar(
        repo_key,
        query_vector,
        top_k=request.top_k,
    )

    print(
        f"ASK: found {len(retrieved_chunks)} "
        "relevant chunks"
    )

    print("ASK: generating answer with LLM...")

    try:
        answer = llm_service.generate_answer(
            request.question,
            retrieved_chunks,
        )

        print("ASK: answer generated")

    except Exception as e:
        print(
            "ERROR WHILE GENERATING ANSWER:",
            repr(e),
        )

        raise HTTPException(
            status_code=400,
            detail=f"Answer generation failed: {e}",
        )

    # IMPORTANT FIX: this return now sits OUTSIDE the try/except block,
    # at the same indentation as "try:" above — so it always runs
    # whenever answer generation succeeds.
    sources = [
        {
            "file_path": c["file_path"],
            "chunk_index": c["chunk_index"],
            "start_line": c.get("start_line"),
            "end_line": c.get("end_line"),
        }
        for c in retrieved_chunks
    ]

    # Save both sides of the conversation, and remember this user used this repo.
    chat_service.save_message(current_user["id"], repo_key, "user", request.question)
    chat_service.save_message(current_user["id"], repo_key, "assistant", answer, sources)
    user_repo_service.record_user_repo(current_user["id"], repo_key)

    return {
        "repo": repo_key,
        "question": request.question,
        "answer": answer,
        "sources": sources,
    }


@router.get("/indexed")
def list_indexed_repos(current_user: dict = Depends(get_current_user)):
    """
    Returns THIS USER's own indexed repos (not everyone's).
    The frontend uses this to show the Recent Repos section.
    """

    try:
        repos = user_repo_service.list_user_repos(current_user["id"])

    except Exception as e:
        print("ERROR WHILE FETCHING INDEXED REPOS:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch indexed repositories: {e}",
        )

    return {
        "repos": repos
    }
@router.get("/history")
def get_chat_history(owner: str, repo: str, current_user: dict = Depends(get_current_user)):
    """Returns this user's past chat messages for a given repo."""
    repo_key = f"{owner}/{repo}"
    messages = chat_service.get_history(current_user["id"], repo_key)
    return {"repo": repo_key, "messages": messages}