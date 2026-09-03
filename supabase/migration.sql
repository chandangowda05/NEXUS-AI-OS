-- ============================================================
-- NEXUS AI OS — Supabase Database Migration
-- ============================================================
-- Run this script in your Supabase Dashboard → SQL Editor
-- Project: https://iqczgasechdprxnjlzep.supabase.co
-- ============================================================

-- 1. Chat Messages Table
-- Stores the full conversation history between user, assistant, and system.
CREATE TABLE IF NOT EXISTS chat_messages (
  id            TEXT PRIMARY KEY,
  sender        TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL,
  timestamp     TEXT NOT NULL,
  code_snippet  JSONB,        -- { language: string, code: string } | null
  action_card   JSONB,        -- { title, description, type, details } | null
  tool_execution_card JSONB,  -- { toolName, status, progressPercent, logOutput } | null
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- 2. Memory Entries Table
-- Multi-tier memory engine: preferences, projects, goals, habits, and facts.
CREATE TABLE IF NOT EXISTS memory_entries (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL CHECK (category IN ('PREFERENCE', 'PROJECT', 'GOAL', 'HABIT', 'FACT')),
  key           TEXT NOT NULL,
  value         TEXT NOT NULL,
  confidence    REAL NOT NULL DEFAULT 1.0,
  updated_at    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_entries_category ON memory_entries(category);

-- 3. Tasks Table
-- Task and automation manager for system, study, coding, and personal tasks.
CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('SYSTEM', 'STUDY', 'CODING', 'PERSONAL')),
  status        TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'PENDING',
  priority      TEXT NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
  created_at_label TEXT NOT NULL,  -- Human-readable label like "Today, 19:00"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 4. User Preferences Table
-- Singleton row for assistant identity, voice, security, and theme settings.
CREATE TABLE IF NOT EXISTS user_preferences (
  id                TEXT PRIMARY KEY DEFAULT 'default',
  assistant_name    TEXT NOT NULL DEFAULT 'NEXUS',
  codename          TEXT NOT NULL DEFAULT 'Project Phoenix',
  wake_word         TEXT NOT NULL DEFAULT 'Hey Nexus',
  voice_name        TEXT NOT NULL DEFAULT 'Holographic Deep Natural',
  voice_speed       REAL NOT NULL DEFAULT 1.0,
  personality_mode  TEXT NOT NULL CHECK (personality_mode IN ('PROFESSIONAL', 'HUMOROUS', 'CONCISE', 'TEACHER')) DEFAULT 'HUMOROUS',
  security_level    TEXT NOT NULL CHECK (security_level IN ('PIN', 'PASSWORD', 'WINDOWS_HELLO', 'NONE')) DEFAULT 'WINDOWS_HELLO',
  theme_accent      TEXT NOT NULL CHECK (theme_accent IN ('CYAN', 'PURPLE', 'EMERALD', 'SAPPHIRE')) DEFAULT 'CYAN',
  sound_enabled     BOOLEAN NOT NULL DEFAULT true,
  high_contrast     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default preferences row
INSERT INTO user_preferences (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Enable Realtime for all tables (optional but recommended)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE memory_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;

-- ============================================================
-- NOTE: Row Level Security (RLS) is intentionally NOT enabled
-- for this initial setup. Once Supabase Auth is integrated,
-- enable RLS and add appropriate policies.
-- ============================================================
