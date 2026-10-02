-- Migration v5: Team Analytics Dashboard (Module 4)
-- Run this in Supabase SQL Editor after migration_v4.sql

-- 1. Add role column to users table for role-based access control (FR-5)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'team_lead';
UPDATE users SET role = 'team_lead' WHERE role IS NULL;

-- 2. Add status column to bugs table for tracking bug resolution metrics (FR-2)
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
UPDATE bugs SET status = 'open' WHERE status IS NULL;

-- Optional snapshot table (per project spec, computation is live on demand,
-- but this table is saved as a reference schema for future caching)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    snapshot_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_key                TEXT NOT NULL,
    period                  TEXT NOT NULL DEFAULT '7d',
    avg_pr_turnaround_hours NUMERIC,
    prs_reviewed            INT DEFAULT 0,
    prs_merged              INT DEFAULT 0,
    bugs_total              INT DEFAULT 0,
    bugs_resolved           INT DEFAULT 0,
    bugs_open               INT DEFAULT 0,
    top_churn_files         JSONB,
    ai_summary              TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_repo_key ON analytics_snapshots (repo_key);
