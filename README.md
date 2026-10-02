
# DevSphere — AI-Powered Developer Productivity & Team Intelligence Platform

DevSphere is an AI assistant for software development teams. It currently has two working modules:

1. **Module 1 — Codebase Intelligence**: connect a GitHub repository and ask natural-language questions about the code, powered by a full RAG (Retrieval-Augmented Generation) pipeline.
2. **Module 2 — AI-Powered PR Code Review**: automatically reviews GitHub Pull Requests using Gemini and posts review comments back on the PR.

> Example (Module 1): *"How does the recommendation logic work?"* → DevSphere reads the actual code, finds the relevant parts, and explains it in plain English — with exact file and line-number citations.
>
> Example (Module 2): Open a Pull Request → DevSphere reads the diff, finds real bugs/security issues, and comments directly on the PR — automatically, within seconds of the PR being opened.

---

## ✅ Module 1 — What's Working

- **GitHub Integration** — reads any public repo's source files via the GitHub REST API (30+ file types supported: `.py`, `.js`, `.java`, `.cpp`, `.go`, `.rs`, `.sql`, and more)
- **Code Chunking** — splits files into smaller pieces with precise line-number tracking
- **AI Embeddings** — converts code into vectors using Google's Gemini embedding API
- **Persistent Vector Database** — embeddings are stored in PostgreSQL (via [Supabase](https://supabase.com) + the `pgvector` extension), so indexing survives server restarts
- **Semantic Search** — finds the most relevant code chunks for any question
- **RAG Answer Generation** — Gemini generates a full, readable answer grounded only in the retrieved code (with citations, to reduce hallucination)
- **Chat UI** — a dark-themed React interface with Markdown-formatted answers and source citations (`file.py:45-62`)
- **User Authentication** — JWT-based login/register system protecting all repo endpoints
- **Chat History Persistence** — every question/answer is saved per (user, repo) in PostgreSQL, so refreshing the page restores the conversation instead of starting blank
- **Per-User Recent Repos** — each user only sees the repos *they* indexed, not everyone's (tracked in a separate `user_repos` table, since the underlying `code_chunks` embeddings are shared across users to avoid re-indexing the same public repo twice)

### Pending (not yet built)
- Zip/file upload (currently GitHub repos only)
- "Sign in with GitHub" (OAuth) — only username/password login exists today
- Connection pooling for PostgreSQL (currently opens a new connection per request — see Known Limitations)

---

## ✅ Module 2 — AI-Powered PR Code Review

**Status: implemented, tested end-to-end, working.**

### What it does
When a developer opens (or updates) a Pull Request on a GitHub repo that has this webhook configured, DevSphere automatically:
1. Receives the PR event via a GitHub webhook
2. Fetches the changed files/diffs from the GitHub API
3. Sends each file's diff to Gemini with a code-review prompt
4. Parses Gemini's response (a JSON array of issues: line, severity, comment)
5. Posts the issues back on the GitHub PR — as inline comments, or as a single summary comment if inline posting fails
6. Saves the full review (status, issues found) to PostgreSQL for later retrieval

### Flow

GitHub PR opened/updated
│
▼
GitHub Webhook ──(ngrok tunnel, for local dev)──▶ FastAPI /api/webhooks/github
│
▼
Signature verified (HMAC SHA-256, GITHUB_WEBHOOK_SECRET)
│
▼
BackgroundTask: process_pr_review()
│
├──▶ github_pr_service.get_pr_files() — fetch changed files/diffs from GitHub API
├──▶ code_review_service.review_file_diff() — send diff to Gemini, parse JSON issues
│ └──▶ llm_service.generate_raw() — same Gemini client as Module 1,
│ with retry + fallback-model logic
├──▶ github_pr_service.post_inline_review() — post comments on the PR
│ (falls back to post_review_comment() if inline posting fails)
└──▶ Save to pr_reviews + pr_review_comments tables


### New Backend Files
- `backend/app/services/github_pr_service.py` — talks to GitHub API: fetches PR file diffs, posts inline review comments or a summary comment
- `backend/app/services/code_review_service.py` — sends a file's diff to Gemini with a review prompt, parses the JSON response into structured issues
- `backend/app/api/webhooks.py` — receives and verifies the GitHub webhook, runs the review as a background task so GitHub doesn't time out
- `backend/app/api/reviews.py` — `GET /api/reviews` and `GET /api/reviews/{owner}/{repo}/{pr_number}` — lets the frontend list/view past reviews

### Changed Files
- `backend/app/config.py` — added `GITHUB_WEBHOOK_SECRET` and `MAX_DIFF_LINES_PER_FILE` settings
- `backend/app/services/llm_service.py` — added `generate_raw()`, a generic prompt-in/text-out Gemini call (reused by code review), with retry (503/429 handling) and a fallback model (`gemini-3.6-flash` → `gemini-2.5-flash` if the primary is overloaded), plus a 30-second per-call timeout to avoid hanging forever
- `backend/app/main.py` — registered `webhooks.router` and `reviews.router`
- `frontend/src/App.jsx` — added a top navbar with Chat / PR Reviews tabs
- `frontend/src/pages/PRReviewsPage.jsx` (NEW) — lists past PR reviews, click through to see individual issues color-coded by severity

### Database Schema (Module 2)
Run this in Supabase SQL Editor if not already applied:
```sql
CREATE TABLE IF NOT EXISTS pr_reviews (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    repo_full_name TEXT NOT NULL,   -- "owner/repo" format
    pr_number INT NOT NULL,
    commit_sha TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | completed | failed
    issues_found INT DEFAULT 0,
    summary TEXT,                    -- populated with the error message if status = 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pr_review_comments (
    id SERIAL PRIMARY KEY,
    review_id INT REFERENCES pr_reviews(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    line_number INT,
    severity TEXT,      -- critical | warning | suggestion
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_reviews_repo_pr_commit ON pr_reviews(repo_full_name, pr_number, commit_sha);
CREATE INDEX IF NOT EXISTS idx_pr_reviews_user_id ON pr_reviews(user_id);
```

⚠️ Naming note: the `pr_reviews` table uses the column name `repo_full_name` (not `repo_key`, which the `user_repos` table uses for the same "owner/repo" concept). Always check which table you're querying before writing SQL against it.

### Environment Variables (add to `.env`)

GITHUB_WEBHOOK_SECRET=your_webhook_secret_here # must match the "Secret" set in GitHub's webhook config
MAX_DIFF_LINES_PER_FILE=500 # diffs longer than this get truncated before sending to Gemini


### API Endpoints (Module 2)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/webhooks/github` | No (HMAC-verified) | Receives GitHub PR webhook events |
| GET | `/api/reviews` | Yes | List the logged-in user's past PR reviews |
| GET | `/api/reviews/{owner}/{repo}/{pr_number}` | Yes | Get one review's full detail, including each individual issue |

### Local Setup — GitHub Webhook + ngrok
1. Install ngrok (prefer the direct binary from https://ngrok.com/download over the Microsoft Store version — the Store version has had PATH/permission issues)
2. `ngrok config add-authtoken YOUR_TOKEN` (one-time)
3. Run backend: `uvicorn app.main:app --reload --port 8000`
4. In a separate terminal: `ngrok http 8000` → copy the `https://xxxx.ngrok-free.app` URL
5. On the target GitHub repo → Settings → Webhooks → Add webhook:
   - Payload URL: `https://xxxx.ngrok-free.app/api/webhooks/github`
   - Content type: `application/json`
   - Secret: same value as `.env`'s `GITHUB_WEBHOOK_SECRET`
   - Events: select only "Pull requests"
6. Open (or update) a PR on that repo — GitHub will POST to the webhook, and DevSphere will review it within a few seconds to a minute

⚠️ Free ngrok URLs change every time ngrok restarts — the GitHub webhook's Payload URL must be updated each time.

### Testing / Verifying Module 2
Swagger cannot trigger the webhook itself (GitHub's HMAC signature can't be faked from Swagger), but everything downstream can be checked there:
1. Open a real test PR (this one step must be done via GitHub)
2. Watch the backend terminal — should show `POST /api/webhooks/github` → `200 OK`, then diff processing + Gemini logs, ending in `status='completed'` or a clear error
3. Verify via Swagger: `GET /api/reviews` (after Authorize) should show the new review with `status: "completed"`
4. Verify in Supabase: `SELECT * FROM pr_reviews ORDER BY created_at DESC LIMIT 5;`
5. Check the actual GitHub PR page for the posted comments

### Known Issues Handled
- Gemini 503 (model overloaded): handled with retry (1s/2s backoff) + automatic fallback from `gemini-3.6-flash` to `gemini-2.5-flash`
- Hanging requests with no response: fixed by adding a 30-second `http_options.timeout` on every Gemini call
- `InFailedSqlTransaction` after a DB error: fixed by calling `conn.rollback()` at the start of the `except` block in `webhooks.py` before the "mark as failed" `UPDATE`

---

## 🏗️ Architecture (Overall)

React Frontend → FastAPI Backend → PostgreSQL + pgvector (Supabase)
│
┌────────────────┼───────────────────┬─────────────────┐
▼ ▼ ▼ ▼
GitHub API Gemini API Gemini Chat Model GitHub Webhooks
(read code / (embeddings) (RAG answers + (PR events →
PR diffs) PR code review) auto-review)


---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| Database | PostgreSQL (Supabase) + pgvector extension |
| Embeddings | Google Gemini Embedding API (`gemini-embedding-001`) |
| LLM | Google Gemini Chat API (`gemini-3.6-flash`, fallback `gemini-2.5-flash`) |
| Auth | JWT (`python-jose`) + `bcrypt` password hashing |
| GitHub Access | GitHub REST API (`httpx`) |
| Local Webhook Testing | ngrok |

---

## 📁 Folder Structure

devsphere/
├── backend/
│ ├── app/
│ │ ├── main.py # FastAPI entrypoint — registers all routers
│ │ ├── config.py # Loads .env settings
│ │ ├── db.py # PostgreSQL connection helper
│ │ ├── dependencies.py # JWT auth dependency (get_current_user)
│ │ ├── api/
│ │ │ ├── repos.py # Module 1: repo indexing, ask, search, history, recent repos
│ │ │ ├── auth.py # Register/login/me endpoints
│ │ │ ├── webhooks.py # Module 2: GitHub webhook receiver
│ │ │ └── reviews.py # Module 2: list/view PR reviews
│ │ └── services/
│ │ ├── github_service.py # Module 1: reads repo files from GitHub
│ │ ├── chunking_service.py # Module 1: splits files into chunks (with line numbers)
│ │ ├── embedding_service.py # Module 1: Gemini embeddings
│ │ ├── llm_service.py # Module 1 + 2: Gemini answer generation + generic completion call
│ │ ├── db_vector_service.py # Module 1: pgvector save/search
│ │ ├── auth_service.py # Password hashing + JWT
│ │ ├── user_service.py # User database operations
│ │ ├── chat_service.py # Module 1: chat history persistence
│ │ ├── user_repo_service.py # Module 1: per-user recent repos
│ │ ├── github_pr_service.py # Module 2: fetch PR diffs, post review comments
│ │ └── code_review_service.py # Module 2: send diff to Gemini, parse issues
│ ├── requirements.txt
│ └── .env.example
├── frontend/
│ └── src/
│ ├── App.jsx # Top navbar (Chat / PR Reviews tabs) + routing
│ ├── index.css # Global layout CSS (html/body/#root height, box-sizing)
│ ├── main.jsx # React entrypoint
│ ├── pages/
│ │ ├── LoginPage.jsx
│ │ ├── ChatPage.jsx # Module 1: chat UI
│ │ └── PRReviewsPage.jsx # Module 2: PR review list + detail UI
│ ├── api/client.js # Axios instance (auto-attaches JWT token)
│ └── markdown.css # Styling for rendered AI answers
└── migration_v2.sql # Database schema (Module 1 tables)


---

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.9+
- Node.js 16+
- A free [Supabase](https://supabase.com) account (for PostgreSQL + pgvector)
- A free [Gemini API key](https://aistudio.google.com/apikey)
- (Optional) A [GitHub Personal Access Token](https://github.com/settings/tokens) for higher API rate limits
- For Module 2: [ngrok](https://ngrok.com/download) and a GitHub repo you can add a webhook to

### 2. Database Setup (Supabase)
1. Create a new Supabase project.
2. In the SQL Editor, run:
```sql
   CREATE EXTENSION IF NOT EXISTS vector;
```
3. Run the full contents of `backend/migration_v2.sql` (Module 1 tables: `code_chunks`, `users`, `chat_messages`, `user_repos`).
4. Run the Module 2 schema SQL shown above (`pr_reviews`, `pr_review_comments`).
5. Copy your database connection string from Project Settings → Database → Connection string (URI).

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and fill in:

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
GITHUB_TOKEN=your_github_personal_access_token # optional but recommended
LLM_API_KEY=your_gemini_api_key
JWT_SECRET=any_long_random_string
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here # Module 2 — must match GitHub webhook config
MAX_DIFF_LINES_PER_FILE=500 # Module 2


Run the backend:
```bash
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` to confirm it's running (Swagger UI).

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173`.

### 5. First Use
1. Register an account on the login screen.
2. Chat tab: enter a GitHub `owner` / `repo` / `branch` and click Connect & Index. Once indexing finishes, ask a question in the chat box.
3. PR Reviews tab (Module 2): set up the GitHub webhook (see Module 2 section), open a PR on the connected repo, and the review will appear here automatically.

---

## 🔑 API Endpoints (summary)

| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Log in, get a JWT token |
| GET | `/api/auth/me` | Yes | Check current logged-in user |
| POST | `/api/repos/build-index` | Yes | Index a GitHub repo |
| POST | `/api/repos/ask` | Yes | Ask a question (full RAG answer) |
| POST | `/api/repos/search` | Yes | Raw semantic search (no LLM answer) |
| GET | `/api/repos/indexed` | Yes | List the logged-in user's indexed repos |
| GET | `/api/repos/history` | Yes | Get saved chat history for a repo |
| POST | `/api/webhooks/github` | No (HMAC-verified) | GitHub PR webhook receiver (Module 2) |
| GET | `/api/reviews` | Yes | List the logged-in user's PR reviews (Module 2) |
| GET | `/api/reviews/{owner}/{repo}/{pr_number}` | Yes | View one PR review's issues in detail (Module 2) |

Full interactive API docs available at `http://localhost:8000/docs` once the backend is running.

---

## ⚠️ Known Limitations

- Files larger than 150 per repo, or larger than ~50 KB each, are skipped to control embedding costs.
- Private GitHub repos require a `GITHUB_TOKEN` with appropriate access in `.env`.
- No connection pooling — `db.py` opens a brand-new PostgreSQL connection (with a fresh `register_vector()` call) on every single request. This is the main known performance bottleneck (login, recent-repos, and PR review DB writes are all slower than they should be, especially against a hosted/remote database). A fix has been designed but not yet applied:
  - Change `db.py` to use `psycopg2.pool.SimpleConnectionPool` instead of opening a new connection per request
  - Every service (`chat_service.py`, `user_repo_service.py`, `db_vector_service.py`, `auth_service.py`/`user_service.py`) should call `db.release_connection(conn)` instead of `conn.close()`
  - Also add these indexes in Supabase:
```sql
    CREATE INDEX IF NOT EXISTS idx_code_chunks_repo_key ON code_chunks(repo_key);
    CREATE INDEX IF NOT EXISTS idx_user_repos_user_id ON user_repos(user_id);
```
- Module 2's inline PR comments can fail to post if a flagged line isn't part of the diff's visible range; falls back to a single summary comment in that case.
- Local webhook testing requires ngrok to stay running, and its free-tier URL changes on every restart.

---

## 📄 License / Academic Context

Built as a final-year B.Tech project. Free to explore, extend, and reuse.