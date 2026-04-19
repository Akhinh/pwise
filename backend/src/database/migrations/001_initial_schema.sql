-- ============================================================
-- PrepWise — Migration 001: Initial Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ─────────────────────────────────────────────────────
CREATE TYPE exam_type AS ENUM ('WAEC', 'NECO');
CREATE TYPE exam_session AS ENUM ('MAY_JUNE', 'GCE', 'JUNE_JULY');
CREATE TYPE difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE quiz_mode AS ENUM ('PRACTICE', 'TIMED', 'MOCK', 'TOPIC_DRILL', 'WEAK_AREAS');
CREATE TYPE subscription_tier AS ENUM ('FREE', 'STUDENT', 'PREMIUM', 'SCHOOL');
CREATE TYPE flag_status AS ENUM ('PENDING', 'REVIEWED', 'FIXED', 'DISMISSED');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

-- ── Updated_at trigger function ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

-- ── subjects ─────────────────────────────────────────────────
CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  exam_types  exam_type[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── users ────────────────────────────────────────────────────
CREATE TABLE users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   VARCHAR(255) NOT NULL UNIQUE,
  display_name            VARCHAR(100) NOT NULL,
  avatar_url              TEXT,
  subscription_tier       subscription_tier NOT NULL DEFAULT 'FREE',
  subscription_expires_at TIMESTAMPTZ,
  streak_count            INTEGER NOT NULL DEFAULT 0,
  last_active_at          TIMESTAMPTZ,
  is_admin                BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── questions ────────────────────────────────────────────────
CREATE TABLE questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type           exam_type NOT NULL,
  exam_session        exam_session NOT NULL DEFAULT 'MAY_JUNE',
  subject             VARCHAR(100) NOT NULL,
  year                INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2030),
  question_text       TEXT NOT NULL CHECK (char_length(question_text) >= 15),
  question_image_url  TEXT,
  options             JSONB NOT NULL,
  correct_answer      CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D','E')),
  ai_explanation      TEXT,
  topic               VARCHAR(150),
  difficulty          difficulty NOT NULL DEFAULT 'MEDIUM',
  source_url          TEXT,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  times_answered      INTEGER NOT NULL DEFAULT 0,
  times_correct       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject, year, question_text)
);
CREATE INDEX idx_questions_subject_year   ON questions (subject, year);
CREATE INDEX idx_questions_exam_type      ON questions (exam_type);
CREATE INDEX idx_questions_topic          ON questions (topic);
CREATE INDEX idx_questions_difficulty     ON questions (difficulty);
CREATE INDEX idx_questions_active         ON questions (is_active);
CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── quiz_sessions ─────────────────────────────────────────────
CREATE TABLE quiz_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode         quiz_mode NOT NULL,
  subject      VARCHAR(100) NOT NULL,
  exam_type    exam_type NOT NULL,
  question_ids UUID[] NOT NULL DEFAULT '{}',
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_score  INTEGER CHECK (total_score >= 0 AND total_score <= 100),
  is_abandoned BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions (user_id);
CREATE INDEX idx_quiz_sessions_mode    ON quiz_sessions (mode);
CREATE TRIGGER trg_quiz_sessions_updated_at
  BEFORE UPDATE ON quiz_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── user_answers ──────────────────────────────────────────────
CREATE TABLE user_answers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES questions(id),
  selected_option       CHAR(1) CHECK (selected_option IN ('A','B','C','D','E')),
  is_correct            BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds    INTEGER NOT NULL DEFAULT 0,
  ai_explanation_viewed BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_answers_session_id  ON user_answers (session_id);
CREATE INDEX idx_user_answers_question_id ON user_answers (question_id);

-- ── subscriptions ─────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                        subscription_tier NOT NULL,
  paystack_subscription_code  VARCHAR(100),
  paystack_customer_code      VARCHAR(100),
  status                      subscription_status NOT NULL DEFAULT 'ACTIVE',
  current_period_start        TIMESTAMPTZ NOT NULL,
  current_period_end          TIMESTAMPTZ NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── payments_log ─────────────────────────────────────────────
CREATE TABLE payments_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  event_type   VARCHAR(100) NOT NULL,
  payload      JSONB NOT NULL,
  processed    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── badges ────────────────────────────────────────────────────
CREATE TABLE badges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL UNIQUE,
  description      TEXT NOT NULL,
  icon_url         TEXT NOT NULL,
  unlock_criteria  JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── user_badges ───────────────────────────────────────────────
CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- ── flagged_questions ─────────────────────────────────────────
CREATE TABLE flagged_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      flag_status NOT NULL DEFAULT 'PENDING',
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_flagged_questions_updated_at
  BEFORE UPDATE ON flagged_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── ai_usage_log ──────────────────────────────────────────────
CREATE TABLE ai_usage_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);
