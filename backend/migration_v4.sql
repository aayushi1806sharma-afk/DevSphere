-- Migration v4: Bug Triage Engine (Module 3)
-- Run this in Supabase SQL Editor after migration_v3.sql

-- Enable pgvector extension if not already enabled
-- (already enabled from Module 1, but safe to repeat)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS bugs (
    bug_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_key        TEXT NOT NULL,                          -- e.g. "owner/repo"
    reported_by     INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_text     TEXT NOT NULL,                          -- submitted error / stack trace
    root_cause      TEXT,                                   -- LLM-generated
    severity        TEXT CHECK (severity IN ('Low', 'Medium', 'High')),
    affected_files  TEXT[],                                 -- verified files belonging to this repository
    external_files  TEXT[],                                 -- files referenced in trace not in this repo
    suggested_fix   TEXT,                                   -- LLM-generated
    -- The report_text embedded as a vector so future triage queries
    -- can retrieve this bug as "similar past issue" (FR-3 / FR-6).
    report_embedding vector(3072),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Speed up "list bugs for repo" queries
CREATE INDEX IF NOT EXISTS idx_bugs_repo_key    ON bugs (repo_key);
CREATE INDEX IF NOT EXISTS idx_bugs_reported_by  ON bugs (reported_by);
-- Note: IVFFlat index omitted — pgvector IVFFlat max is 2000 dims,
-- our 3072-dim vectors exceed that. Sequential scan is fine at this scale.
