-- Phase 3 additions

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio_answers JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_lower
  ON users (lower(handle))
  WHERE handle IS NOT NULL;
