// ============================================================
// PrepWise — Quiz: Repository
// ============================================================

import { supabaseAdmin } from '../../database/client';
import type { QuizSession, UserAnswer } from '@prepwise/types';

export const quizRepository = {
  async createSession(data: {
    userId: string; mode: string; subject: string;
    examType: string; questionIds: string[];
  }): Promise<QuizSession> {
    const { data: row, error } = await supabaseAdmin
      .from('quiz_sessions')
      .insert({
        user_id: data.userId,
        mode: data.mode,
        subject: data.subject,
        exam_type: data.examType,
        question_ids: data.questionIds,
      })
      .select().single();
    if (error) throw new Error(error.message);
    return mapSession(row);
  },

  async findSession(id: string): Promise<QuizSession | null> {
    const { data } = await supabaseAdmin
      .from('quiz_sessions').select('*').eq('id', id).single();
    return data ? mapSession(data) : null;
  },

  async getUserSessions(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { data, count } = await supabaseAdmin
      .from('quiz_sessions').select('*', { count: 'exact' })
      .eq('user_id', userId).eq('is_abandoned', false)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return {
      items: (data ?? []).map(mapSession),
      total: count ?? 0,
      page,
      limit,
      hasMore: offset + limit < (count ?? 0),
    };
  },

  async completeSession(id: string, score: number): Promise<QuizSession> {
    const { data, error } = await supabaseAdmin
      .from('quiz_sessions')
      .update({ completed_at: new Date().toISOString(), total_score: score })
      .eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapSession(data);
  },

  async saveAnswer(data: {
    sessionId: string; questionId: string;
    selectedOption: string | null; isCorrect: boolean; timeSpentSeconds: number;
  }): Promise<UserAnswer> {
    const { data: row, error } = await supabaseAdmin
      .from('user_answers')
      .upsert({
        session_id: data.sessionId,
        question_id: data.questionId,
        selected_option: data.selectedOption,
        is_correct: data.isCorrect,
        time_spent_seconds: data.timeSpentSeconds,
      }, { onConflict: 'session_id,question_id' })
      .select().single();
    if (error) throw new Error(error.message);
    return mapAnswer(row);
  },

  async getSessionAnswers(sessionId: string): Promise<UserAnswer[]> {
    const { data } = await supabaseAdmin
      .from('user_answers').select('*').eq('session_id', sessionId);
    return (data ?? []).map(mapAnswer);
  },
};

function mapSession(row: Record<string, unknown>): QuizSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mode: row.mode as QuizSession['mode'],
    subject: row.subject as string,
    examType: row.exam_type as QuizSession['examType'],
    questionIds: row.question_ids as string[],
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string) ?? null,
    totalScore: (row.total_score as number) ?? null,
    isAbandoned: row.is_abandoned as boolean,
  };
}

function mapAnswer(row: Record<string, unknown>): UserAnswer {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    questionId: row.question_id as string,
    selectedOption: (row.selected_option as UserAnswer['selectedOption']) ?? null,
    isCorrect: row.is_correct as boolean,
    timeSpentSeconds: row.time_spent_seconds as number,
    aiExplanationViewed: row.ai_explanation_viewed as boolean,
  };
}

// ============================================================
// PrepWise — Quiz: Service
// ============================================================

import { AppError } from '../../middleware/errorHandler';
import { questionsRepository } from '../questions/questions.repository';
import { shuffleArray } from '@prepwise/utils';
import type { QuizMode, ExamType } from '@prepwise/types';

export interface StartQuizOptions {
  userId: string;
  userTier?: string;
  mode: QuizMode;
  subject: string;
  examType: ExamType;
  year?: number;
  questionCount?: number;
  timeLimitMinutes?: number;
}

export const quizService = {
  async startQuiz(options: StartQuizOptions) {
    const count = options.mode === 'MOCK' ? 50 : (options.questionCount ?? 20);
    const userTier = options.userTier ?? 'FREE';

    // Enforce free tier daily limit
    if (userTier === 'FREE') {
      const today = new Date().toISOString().split('T')[0];
      const { count: sessionCount } = await supabaseAdmin
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', options.userId)
        .gte('started_at', `${today}T00:00:00Z`);

      const questionsStarted = (sessionCount ?? 0) * 20;
      if (questionsStarted >= 10) {
        throw new AppError(
          'Free plan allows 10 questions per day. Upgrade to continue.',
          403,
          'UPGRADE_REQUIRED'
        );
      }
    }

    // Block mock exams for non-premium
    if (options.mode === 'MOCK' && !['PREMIUM', 'SCHOOL'].includes(userTier)) {
      throw new AppError('Mock exams require Premium plan.', 403, 'UPGRADE_REQUIRED');
    }

    const { items } = await questionsRepository.findMany({
      subject: options.subject,
      examType: options.examType,
      year: options.year,
      isActive: true,
      // Only use verified questions for MOCK exams
      isVerified: options.mode === 'MOCK' ? true : undefined,
      limit: count * 3,
    });

    if (items.length === 0) {
      throw new AppError(
        options.mode === 'MOCK'
          ? 'Not enough verified questions available for a mock exam in this subject. Try again later.'
          : 'No questions found for the selected filters. Try different options.',
        404
      );
    }

    const selected = shuffleArray(items).slice(0, Math.min(count, items.length));
    const questionIds = selected.map((q) => q.id);

    const session = await quizRepository.createSession({
      userId: options.userId,
      mode: options.mode,
      subject: options.subject,
      examType: options.examType,
      questionIds,
    });

    // Strip correct answers before sending to client
    const questionsForClient = selected.map(({ correctAnswer, aiExplanation, ...q }) => q);
    return { session, questions: questionsForClient };
  },

  async submitAnswer(
    sessionId: string,
    userId: string,
    questionId: string,
    selectedOption: string | null,
    timeSpentSeconds: number
  ) {
    const session = await quizRepository.findSession(sessionId);
    if (!session) throw new AppError('Quiz session not found', 404);
    if (session.userId !== userId) throw new AppError('Forbidden', 403);
    if (session.completedAt) throw new AppError('This quiz session is already completed', 400);
    if (!session.questionIds.includes(questionId)) throw new AppError('Question not in this session', 400);

    const question = await questionsRepository.findById(questionId);
    if (!question) throw new AppError('Question not found', 404);

    const isCorrect = selectedOption === question.correctAnswer;

    await quizRepository.saveAnswer({
      sessionId,
      questionId,
      selectedOption,
      isCorrect,
      timeSpentSeconds,
    });

    // Update question stats via DB function
    await supabaseAdmin.rpc('increment_question_stats', {
      q_id: questionId,
      correct: isCorrect,
    });

    return { isCorrect, correctAnswer: question.correctAnswer };
  },

  async completeQuiz(sessionId: string, userId: string) {
    const session = await quizRepository.findSession(sessionId);
    if (!session) throw new AppError('Quiz session not found', 404);
    if (session.userId !== userId) throw new AppError('Forbidden', 403);
    if (session.completedAt) throw new AppError('Already completed', 400);

    const answers = await quizRepository.getSessionAnswers(sessionId);
    const correct = answers.filter((a) => a.isCorrect).length;
    const score = Math.round((correct / session.questionIds.length) * 100);

    const completedSession = await quizRepository.completeSession(sessionId, score);
    const questions = await questionsRepository.findByIds(session.questionIds);

    return {
      session: completedSession,
      totalQuestions: session.questionIds.length,
      correctCount: correct,
      wrongCount: answers.filter((a) => !a.isCorrect && a.selectedOption !== null).length,
      skippedCount: answers.filter((a) => a.selectedOption === null).length,
      totalScore: score,
      timeTakenSeconds: Math.floor(
        (new Date(completedSession.completedAt!).getTime() - new Date(completedSession.startedAt).getTime()) / 1000
      ),
      answers: answers.map((ans) => ({
        question: questions.find((q) => q.id === ans.questionId)!,
        selectedOption: ans.selectedOption,
        isCorrect: ans.isCorrect,
        aiExplanation: questions.find((q) => q.id === ans.questionId)?.aiExplanation ?? null,
      })),
    };
  },

  async resumeSession(sessionId: string, userId: string) {
    const session = await quizRepository.findSession(sessionId);
    if (!session) throw new AppError('Session not found', 404);
    if (session.userId !== userId) throw new AppError('Forbidden', 403);
    if (session.completedAt) throw new AppError('Session already completed', 400);

    const questions = await questionsRepository.findByIds(session.questionIds);
    const answers = await quizRepository.getSessionAnswers(sessionId);
    const answeredIds = answers.map((a) => a.questionId);

    const questionsForClient = questions.map(({ correctAnswer, aiExplanation, ...q }) => q);
    return { session, questions: questionsForClient, answeredIds };
  },

  async getHistory(userId: string, page: number) {
    return quizRepository.getUserSessions(userId, page);
  },

  async getReport(sessionId: string, userId: string) {
    const session = await quizRepository.findSession(sessionId);
    if (!session) throw new AppError('Session not found', 404);
    if (session.userId !== userId) throw new AppError('Forbidden', 403);
    if (!session.completedAt) throw new AppError('Session not yet completed', 400);

    const answers = await quizRepository.getSessionAnswers(sessionId);
    const questions = await questionsRepository.findByIds(session.questionIds);
    const correct = answers.filter((a) => a.isCorrect).length;

    return {
      session,
      totalQuestions: session.questionIds.length,
      correctCount: correct,
      wrongCount: answers.filter((a) => !a.isCorrect && a.selectedOption !== null).length,
      skippedCount: answers.filter((a) => a.selectedOption === null).length,
      totalScore: session.totalScore ?? 0,
      timeTakenSeconds: Math.floor(
        (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
      ),
      answers: answers.map((ans) => ({
        question: questions.find((q) => q.id === ans.questionId)!,
        selectedOption: ans.selectedOption,
        isCorrect: ans.isCorrect,
        aiExplanation: questions.find((q) => q.id === ans.questionId)?.aiExplanation ?? null,
      })),
    };
  },
};

// ============================================================
// PrepWise — Quiz: Controller + Routes
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

export const quizController = {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z.object({
        mode: z.enum(['PRACTICE', 'TIMED', 'MOCK', 'TOPIC_DRILL', 'WEAK_AREAS']),
        subject: z.string(),
        examType: z.enum(['WAEC', 'NECO']),
        year: z.number().int().optional(),
        questionCount: z.number().int().min(5).max(100).default(20),
        timeLimitMinutes: z.number().int().optional(),
      }).parse(req.body);

      const result = await quizService.startQuiz({
        ...body,
        userId: req.user!.userId,
        userTier: req.user!.tier,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z.object({
        questionId: z.string().uuid(),
        selectedOption: z.enum(['A', 'B', 'C', 'D', 'E']).nullable(),
        timeSpentSeconds: z.number().int().min(0).default(0),
      }).parse(req.body);

      const result = await quizService.submitAnswer(
        req.params.sessionId,
        req.user!.userId,
        body.questionId,
        body.selectedOption,
        body.timeSpentSeconds,
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quizService.completeQuiz(req.params.sessionId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quizService.resumeSession(req.params.sessionId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const { page } = z.object({
        page: z.coerce.number().int().min(1).default(1),
      }).parse(req.query);
      const result = await quizService.getHistory(req.user!.userId, page);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async report(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quizService.getReport(req.params.sessionId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};

const router = Router();
router.post('/start',               authenticate, quizController.start);
router.post('/:sessionId/answer',   authenticate, quizController.submitAnswer);
router.post('/:sessionId/complete', authenticate, quizController.complete);
router.get('/history',              authenticate, quizController.history);
router.get('/:sessionId',           authenticate, quizController.resume);
router.get('/:sessionId/report',    authenticate, quizController.report);

export { router as quizRoutes };