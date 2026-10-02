"""
Module 1, Step 1: Reading a GitHub repository's files using the GitHub REST API.

No AI here yet — this file's only job is: given a repo, return a list of
its code files with their content, so later steps can chunk + embed them.
"""

import requests
from app.config import settings

GITHUB_API_BASE = "https://api.github.com"

REQUEST_TIMEOUT = 10  # seconds

_session = requests.Session()

ALLOWED_EXTENSIONS = {
    # Web / scripting
    ".py", ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".php", ".rb",
    # Systems / compiled languages
    ".java", ".go", ".rs", ".c", ".h", ".cpp", ".hpp", ".cs", ".swift", ".kt",
    # Data / config / docs
    ".md", ".json", ".yml", ".yaml", ".xml", ".toml", ".sql",
    ".html", ".css", ".scss", ".sh",
}

ALLOWED_FILENAMES_NO_EXTENSION = {
    "README", "LICENSE", "Dockerfile", "Makefile",
}

IGNORED_FOLDERS = {
    "node_modules", ".git", "dist", "build", "venv", "__pycache__", ".next",
}

# Skip files bigger than this — huge generated/data files aren't useful for
# code understanding, and would waste embedding API calls and money.
MAX_FILE_SIZE_BYTES = 50_000  # ~50 KB


def _headers():
    headers = {"Accept": "application/vnd.github+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


def get_repo_file_tree(owner: str, repo: str, branch: str = "main"):
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    print(f"[github_service] Fetching file tree for {owner}/{repo}@{branch}...")
    response = _session.get(url, headers=_headers(), timeout=REQUEST_TIMEOUT)

    if response.status_code == 404:
        raise ValueError(
            f"Repository '{owner}/{repo}' (branch '{branch}') was not found. "
            f"Check that the owner/repo names are spelled correctly, the "
            f"branch exists, and the repo is public (or your token has access)."
        )
    if response.status_code == 403:
        raise ValueError(
            "GitHub API rate limit exceeded. Add a GITHUB_TOKEN in your .env "
            "file to get a much higher rate limit (5000 requests/hour instead of 60)."
        )

    response.raise_for_status()
    print(f"[github_service] File tree fetched OK.")

    data = response.json()
    all_paths = [item["path"] for item in data.get("tree", []) if item["type"] == "blob"]

    def is_useful(path: str) -> bool:
        filename = path.split("/")[-1]
        matches_extension = any(path.endswith(ext) for ext in ALLOWED_EXTENSIONS)
        matches_known_filename = filename in ALLOWED_FILENAMES_NO_EXTENSION
        in_ignored_folder = any(f"/{folder}/" in f"/{path}" for folder in IGNORED_FOLDERS)
        return (matches_extension or matches_known_filename) and not in_ignored_folder

    useful_paths = [path for path in all_paths if is_useful(path)]
    return useful_paths


def get_file_content(owner: str, repo: str, path: str, branch: str = "main") -> str:
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    response = _session.get(url, headers=_headers(), timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.text


def read_repository(owner: str, repo: str, branch: str = "main", max_files: int = 150):
    """
    max_files was originally capped at 30 for fast testing. Now raised to
    150 to support real, larger student projects — still bounded so a huge
    repo can't blow up embedding costs or request time unexpectedly.
    """
    file_paths = get_repo_file_tree(owner, repo, branch)

    if not file_paths:
        raise ValueError(
            f"No readable code files found in '{owner}/{repo}' (branch '{branch}'). "
            f"The repo might be empty, or only contain file types DevSphere doesn't index."
        )

    total_found = len(file_paths)
    file_paths = file_paths[:max_files]

    if total_found > max_files:
        print(f"[github_service] Repo has {total_found} files; only indexing the first {max_files}.")

    files = []
    for path in file_paths:
        try:
            print(f"[github_service] Fetching content for: {path}")
            content = get_file_content(owner, repo, path, branch)

            if len(content.encode("utf-8")) > MAX_FILE_SIZE_BYTES:
                print(f"[github_service]   -> SKIPPED (too large: {len(content)} chars)")
                continue

            print(f"[github_service]   -> got {len(content)} characters")
            files.append({"path": path, "content": content})
        except requests.exceptions.RequestException as e:
            print(f"[github_service]   -> FAILED for {path}: {e}")
            continue

    print(f"[github_service] Done. Fetched {len(files)}/{len(file_paths)} files.")
    return files