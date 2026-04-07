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
