CREATE TABLE users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE TABLE creatures (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  generation_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMP,
  next_generation_at TIMESTAMP,
  experience JSONB DEFAULT '{}',
  UNIQUE(user_id)
);

CREATE TABLE frames (
  id TEXT PRIMARY KEY,
  creature_id TEXT NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  ascii TEXT NOT NULL,
  weights JSONB NOT NULL,
  generation_index INTEGER NOT NULL,
  parent_frame_id TEXT REFERENCES frames(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experience_log (
  id TEXT PRIMARY KEY,
  creature_id TEXT NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  attractor_x REAL NOT NULL,
  attractor_y REAL NOT NULL,
  attractor_z REAL NOT NULL,
  celestial_sun REAL NOT NULL,
  celestial_moon REAL NOT NULL,
  state_snapshot JSONB NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_frames_creature ON frames(creature_id);
CREATE INDEX idx_experience_creature ON experience_log(creature_id);
CREATE INDEX idx_creatures_next_gen ON creatures(next_generation_at);

-- Phase 2a additions

ALTER TABLE creatures ADD COLUMN last_seen_at TIMESTAMP;
ALTER TABLE creatures ADD COLUMN is_active BOOLEAN DEFAULT true;
UPDATE creatures SET is_active = true WHERE is_active IS NULL;
ALTER TABLE creatures ALTER COLUMN is_active SET NOT NULL;

CREATE TABLE neighbors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creature_id TEXT NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, creature_id)
);

CREATE INDEX idx_neighbors_user ON neighbors(user_id);
CREATE INDEX idx_neighbors_expires ON neighbors(expires_at);
CREATE INDEX idx_creatures_active ON creatures(is_active);
CREATE INDEX idx_creatures_last_seen ON creatures(last_seen_at);

-- Phase 2b additions

ALTER TABLE users ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '{}';

-- Phase 2c additions

-- Remove one-creature-per-user constraint
ALTER TABLE creatures DROP CONSTRAINT IF EXISTS creatures_user_id_key;

-- Add display order for multiple creatures
ALTER TABLE creatures ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Synthetic flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT false;
ALTER TABLE creatures ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT false;

-- Attractor type per creature (for landing page)
ALTER TABLE creatures ADD COLUMN IF NOT EXISTS attractor_type TEXT DEFAULT 'dadras';

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed default settings
INSERT INTO admin_settings (key, value) VALUES
  ('max_creatures_per_user', '3'),
  ('min_creature_floor', '25'),
  ('synthetic_generation_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creatures_user ON creatures(user_id);
CREATE INDEX IF NOT EXISTS idx_creatures_synthetic ON creatures(is_synthetic);

-- Phase 3 additions

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio_answers JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_lower
  ON users (lower(handle))
  WHERE handle IS NOT NULL;
