// ============================================================
// PrepWise — Progress Module
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { supabaseAdmin } from '../../database/client';

const router = Router();

// GET /progress/summary
router.get('/summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [userResult, sessionsResult, badgesResult] = await Promise.all([
      supabaseAdmin.from('users').select('streak_count').eq('id', userId).single(),
      supabaseAdmin.from('quiz_sessions')
        .select('total_score, completed_at')
        .eq('user_id', userId).eq('is_abandoned', false).not('completed_at', 'is', null),
      supabaseAdmin.from('user_badges')
        .select('*, badges(name, description, icon_url)')
        .eq('user_id', userId),
    ]);

    const sessions = sessionsResult.data ?? [];
    const avgScore = sessions.length
      ? Math.round(sessions.reduce((sum: number, s: { total_score: number }) => sum + (s.total_score ?? 0), 0) / sessions.length)
      : 0;

    const subjectsResult = await supabaseAdmin
      .from('quiz_sessions').select('subject')
      .eq('user_id', userId).eq('is_abandoned', false);

    const uniqueSubjects = new Set((subjectsResult.data ?? []).map((s: { subject: string }) => s.subject));

    res.json({
      success: true,
      data: {
        streakCount: userResult.data?.streak_count ?? 0,
        totalQuestionsAnswered: sessions.length * 20, // approximation
        averageScore: avgScore,
        subjectCount: uniqueSubjects.size,
        badges: (badgesResult.data ?? []).map((b: Record<string, unknown>) => ({
          id: b.id,
          name: (b.badges as { name: string }).name,
          description: (b.badges as { description: string }).description,
          iconUrl: (b.badges as { icon_url: string }).icon_url,
          awardedAt: b.awarded_at,
        })),
      },
    });
  } catch (err) { next(err); }
});

// GET /progress/subjects
router.get('/subjects', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { data: sessions } = await supabaseAdmin
      .from('quiz_sessions')
      .select('subject, total_score, completed_at')
      .eq('user_id', userId).not('completed_at', 'is', null);

    const bySubject = new Map<string, { scores: number[]; last: string }>();
    for (const s of (sessions ?? [])) {
      const entry = bySubject.get(s.subject) ?? { scores: [], last: '' };
      if (s.total_score !== null) entry.scores.push(s.total_score);
      if (s.completed_at > entry.last) entry.last = s.completed_at;
      bySubject.set(s.subject, entry);
    }

    const result = [...bySubject.entries()].map(([subject, { scores, last }]) => ({
      subject,
      questionsAnswered: scores.length * 20,
      accuracyPercent: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      lastPracticedAt: last || null,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /progress/activity?days=7|30
router.get('/activity', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days } = z.object({ days: z.coerce.number().int().refine((n) => n === 7 || n === 30).default(7) }).parse(req.query);
    const userId = req.user!.userId;
    const since = new Date(Date.now() - days * 86400 * 1000).toISOString();

    const { data } = await supabaseAdmin
      .from('quiz_sessions')
      .select('started_at, completed_at')
      .eq('user_id', userId).gte('started_at', since);

    // Group by date
    const byDate = new Map<string, { questions: number; sessions: number }>();
    for (const s of (data ?? [])) {
      const date = s.started_at.split('T')[0];
      const entry = byDate.get(date) ?? { questions: 0, sessions: 0 };
      entry.sessions += 1;
      entry.questions += 20; // approximate
      byDate.set(date, entry);
    }

    // Fill gaps with 0s
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400 * 1000).toISOString().split('T')[0];
      const entry = byDate.get(d) ?? { questions: 0, sessions: 0 };
      result.push({ date: d, questionsAnswered: entry.questions, sessionsCompleted: entry.sessions });
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /leaderboard
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject } = z.object({ subject: z.string().optional() }).parse(req.query);
    let query = supabaseAdmin
      .from('quiz_sessions')
      .select('user_id, total_score, users(id, display_name, avatar_url)')
      .not('completed_at', 'is', null)
      .not('total_score', 'is', null)
      .order('total_score', { ascending: false })
      .limit(50);

    if (subject) query = query.eq('subject', subject);

    const { data } = await query;
    const result = (data ?? []).map((row: Record<string, unknown>, idx: number) => ({
      rank: idx + 1,
      user: {
        id: (row.users as { id: string }).id,
        displayName: (row.users as { display_name: string }).display_name,
        avatarUrl: (row.users as { avatar_url: string | null }).avatar_url ?? null,
      },
      score: row.total_score,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export { router as progressRoutes };

// Separate leaderboard router
const leaderboardRouter = Router();
leaderboardRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject } = z.object({ subject: z.string().optional() }).parse(req.query);
    let query = supabaseAdmin
      .from('quiz_sessions')
      .select('user_id, total_score, users(id, display_name, avatar_url)')
      .not('completed_at', 'is', null)
      .not('total_score', 'is', null)
      .order('total_score', { ascending: false })
      .limit(50);

    if (subject) query = query.eq('subject', subject);

    const { data } = await query;
    const result = (data ?? []).map((row: Record<string, unknown>, idx: number) => ({
      rank: idx + 1,
      user: { id: (row.users as { id: string }).id, displayName: (row.users as { display_name: string }).display_name, avatarUrl: (row.users as { avatar_url: string | null }).avatar_url ?? null },
      score: row.total_score,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});
export { leaderboardRouter as leaderboardRoutes };
