"""
Module 1, Step 2 (upgraded): Splitting file content into smaller "chunks",
now with LINE NUMBER TRACKING so we can give precise citations like
"app.py, lines 45-62" instead of just "app.py".
"""

CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200


def _line_number_at(content: str, char_index: int) -> int:
    """Given a character position, returns which line number (1-indexed) it's on."""
    return content.count("\n", 0, char_index) + 1


def chunk_text(content: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    """
    Splits text into overlapping chunks, each carrying its start_line and
    end_line within the original file.
    Returns: [{"content": str, "start_line": int, "end_line": int}, ...]
    """
    if len(content) <= chunk_size:
        if not content.strip():
            return []
        total_lines = content.count("\n") + 1
        return [{"content": content, "start_line": 1, "end_line": total_lines}]

    chunks = []
    start = 0

    while start < len(content):
        end = start + chunk_size

        if end < len(content):
            last_newline = content.rfind("\n\n", start, end)
            if last_newline != -1 and last_newline > start:
                end = last_newline

        raw_chunk = content[start:end]
        chunk = raw_chunk.strip()

        if chunk:
            leading_whitespace = len(raw_chunk) - len(raw_chunk.lstrip())
            start_line = _line_number_at(content, start + leading_whitespace)
            end_line = _line_number_at(content, start + leading_whitespace + len(chunk))

            chunks.append({
                "content": chunk,
                "start_line": start_line,
                "end_line": end_line,
            })

        # Guarantee forward progress: if applying the overlap would not
        # move us past our current position (can happen when the
        # "\n\n" boundary we snapped `end` to is close to `start`),
        # skip the overlap for this step and just move to `end`.
        new_start = end - overlap
        if new_start <= start:
            new_start = end
        start = new_start

    return chunks


def chunk_file(path: str, content: str):
    """Takes one file's {path, content}, returns chunk dicts with file path + line range."""
    pieces = chunk_text(content)

    return [
        {
            "file_path": path,
            "chunk_index": i,
            "content": piece["content"],
            "start_line": piece["start_line"],
            "end_line": piece["end_line"],
        }
        for i, piece in enumerate(pieces)
    ]


def chunk_files(files: list):
    """Takes list of {path, content} dicts, returns flat list of all chunks."""
    all_chunks = []
    for file in files:
        all_chunks.extend(chunk_file(file["path"], file["content"]))
    return all_chunks