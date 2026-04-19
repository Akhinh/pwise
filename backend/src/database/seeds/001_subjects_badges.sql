-- ============================================================
-- PrepWise — Seed: Subjects & Badges
-- Run after migrations
-- ============================================================

-- ── Subjects ──────────────────────────────────────────────────
INSERT INTO subjects (name, exam_types, is_active) VALUES
  ('Mathematics',           '{WAEC,NECO}', true),
  ('English Language',      '{WAEC,NECO}', true),
  ('Biology',               '{WAEC,NECO}', true),
  ('Chemistry',             '{WAEC,NECO}', true),
  ('Physics',               '{WAEC,NECO}', true),
  ('Economics',             '{WAEC,NECO}', true),
  ('Government',            '{WAEC,NECO}', true),
  ('Literature in English', '{WAEC,NECO}', true),
  ('Geography',             '{WAEC,NECO}', true),
  ('Christian Religious Studies', '{WAEC,NECO}', true),
  ('Islamic Religious Studies',   '{WAEC,NECO}', true),
  ('Agricultural Science',  '{WAEC,NECO}', true),
  ('Commerce',              '{WAEC,NECO}', true),
  ('Financial Accounting',  '{WAEC,NECO}', true),
  ('Further Mathematics',   '{WAEC,NECO}', true)
ON CONFLICT (name) DO NOTHING;

-- ── Badges ────────────────────────────────────────────────────
INSERT INTO badges (name, description, icon_url, unlock_criteria) VALUES
  ('First Quiz',      'Completed your very first quiz',            '/badges/first-quiz.png',      '{"type":"quiz_count","value":1}'),
  ('7-Day Streak',    'Practiced for 7 consecutive days',          '/badges/streak-7.png',        '{"type":"streak","value":7}'),
  ('30-Day Streak',   'Practiced for 30 consecutive days',         '/badges/streak-30.png',       '{"type":"streak","value":30}'),
  ('100 Questions',   'Answered 100 questions in total',           '/badges/100-questions.png',   '{"type":"total_questions","value":100}'),
  ('500 Questions',   'Answered 500 questions in total',           '/badges/500-questions.png',   '{"type":"total_questions","value":500}'),
  ('Subject Master',  'Scored 80%+ in a subject across 10 quizzes','/badges/subject-master.png', '{"type":"subject_accuracy","accuracy":80,"quizCount":10}'),
  ('Speed Demon',     'Completed a 20-question quiz in under 10 min','/badges/speed-demon.png',  '{"type":"quiz_speed","questions":20,"seconds":600}'),
  ('Perfect Score',   'Got 100% on a timed quiz',                  '/badges/perfect.png',         '{"type":"perfect_score","mode":"TIMED"}'),
  ('Consistent',      'Practiced at least 3 times per week for a month', '/badges/consistent.png','{"type":"weekly_frequency","perWeek":3,"weeks":4}')
ON CONFLICT (name) DO NOTHING;
