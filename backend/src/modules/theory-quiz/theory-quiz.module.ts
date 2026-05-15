// ============================================================
// PrepWise — Theory Quiz Module
// Place in: backend/src/modules/theory-quiz/theory-quiz.module.ts
// Register in app.ts: app.use('/api/v1/theory-quiz', theoryQuizRoutes)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../database/client';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();

// ── POST /api/v1/theory-quiz/start ───────────────────────────
// Premium+ only. Loads all theory questions for subject/examType/year.
router.post('/start', authenticate, requireTier('PREMIUM'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, examType, year } = z.object({
      subject:  z.string().min(1),
      examType: z.enum(['WAEC', 'NECO']),
      year:     z.number().int().min(2000).max(2030),
    }).parse(req.body);

    // Fetch all theory questions for this subject/year
    const { data: questions, error } = await supabaseAdmin
      .from('theory_questions')
      .select('id, subject, exam_type, year, question_number, question_text, sub_questions, question_image_url, topic')
      .eq('subject', subject)
      .eq('exam_type', examType)
      .eq('year', year)
      .order('question_number', { ascending: true });

    if (error) throw new Error(error.message);

    if (!questions || questions.length === 0) {
      throw new AppError(
        `No theory questions found for ${subject} ${examType} ${year}. Try a different year.`,
        404,
        'NO_THEORY_QUESTIONS'
      );
    }

    // Create a session record (reuse quiz_sessions table, mode = MOCK)
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('quiz_sessions')
      .insert({
        user_id:      req.user!.userId,
        mode:         'MOCK',
        subject,
        exam_type:    examType,
        question_ids: questions.map(q => q.id),
      })
      .select()
      .single();

    if (sessionErr) throw new Error(sessionErr.message);

    // Map to camelCase for client — answers hidden during exam
    const clientQuestions = questions.map(q => ({
      id:              q.id,
      subject:         q.subject,
      examType:        q.exam_type,
      year:            q.year,
      questionNumber:  q.question_number,
      questionText:    q.question_text,
      subQuestions:    q.sub_questions ?? [],
      questionImageUrl: q.question_image_url ?? null,
      topic:           q.topic ?? null,
    }));

    res.status(201).json({
      success: true,
      data: {
        session: {
          id:             session.id,
          subject,
          examType,
          year,
          startedAt:      session.started_at,
          totalQuestions: questions.length,
        },
        questions: clientQuestions,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/v1/theory-quiz/:sessionId/review ────────────────
// Called after exam ends — returns questions WITH model answers
router.get('/:sessionId/review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const { data: session } = await supabaseAdmin
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', req.user!.userId)
      .single();

    if (!session) throw new AppError('Session not found', 404);

    // Now include answer field
    const { data: questions } = await supabaseAdmin
      .from('theory_questions')
      .select('id, subject, exam_type, year, question_number, question_text, sub_questions, answer, question_image_url, topic')
      .in('id', session.question_ids)
      .order('question_number', { ascending: true });

    const mapped = (questions ?? []).map(q => ({
      id:              q.id,
      subject:         q.subject,
      examType:        q.exam_type,
      year:            q.year,
      questionNumber:  q.question_number,
      questionText:    q.question_text,
      subQuestions:    q.sub_questions ?? [],
      answer:          q.answer ?? null,
      questionImageUrl: q.question_image_url ?? null,
      topic:           q.topic ?? null,
    }));

    res.json({
      success: true,
      data: {
        session: {
          id:             session.id,
          subject:        session.subject,
          examType:       session.exam_type,
          startedAt:      session.started_at,
          completedAt:    session.completed_at,
          totalQuestions: session.question_ids.length,
        },
        questions: mapped,
      },
    });
  } catch (err) { next(err); }
});

// ── POST /api/v1/theory-quiz/:sessionId/complete ─────────────
router.post('/:sessionId/complete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const { error } = await supabaseAdmin
      .from('quiz_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', req.user!.userId);

    if (error) throw new AppError('Session not found', 404);

    res.json({ success: true, data: { sessionId } });
  } catch (err) { next(err); }
});

// ── POST /api/v1/theory-quiz/:sessionId/flag ─────────────────
router.post('/:sessionId/flag', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questionId, reason } = z.object({
      questionId: z.string().uuid(),
      reason:     z.string().min(5),
    }).parse(req.body);

    // Check for existing flag
    const { data: existing } = await supabaseAdmin
      .from('flagged_questions')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', req.user!.userId)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ success: false, error: 'You have already reported this question.' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('flagged_questions')
      .insert({
        question_id: questionId,
        user_id:     req.user!.userId,
        reason:      reason.trim(),
        status:      'PENDING',
      });

    if (error) throw new Error(error.message);

    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export { router as theoryQuizRoutes };