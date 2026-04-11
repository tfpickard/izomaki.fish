-- Phase 3 additions

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio_answers JSONB DEFAULT '{}'::jsonb;

-- Deduplicate handles before creating the unique index.
-- For any set of accounts sharing the same case-insensitive handle,
-- keep the earliest-created one and nullify the rest.
UPDATE users SET handle = NULL
WHERE handle IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (lower(handle)) id
    FROM users
    WHERE handle IS NOT NULL
    ORDER BY lower(handle), created_at ASC
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_lower
  ON users (lower(handle))
  WHERE handle IS NOT NULL;
