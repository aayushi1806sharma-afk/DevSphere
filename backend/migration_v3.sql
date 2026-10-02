-- Migration v3: Chat history + per-user recent repos
-- Run this in Supabase SQL Editor (this file is just a saved reference copy)

CREATE TABLE IF NOT EXISTS user_repos (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_key TEXT NOT NULL,
    last_used_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, repo_key)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_key TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_repos_user_id ON user_repos (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_repo ON chat_messages (user_id, repo_key);