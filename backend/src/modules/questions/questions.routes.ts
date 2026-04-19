// ============================================================
// PrepWise — Questions: Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { questionsService } from './questions.service';

export const questionsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = z.object({
        subject: z.string().optional(),
        year: z.coerce.number().int().optional(),
        examType: z.enum(['WAEC', 'NECO']).optional(),
        topic: z.string().optional(),
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }).parse(req.query);

      const result = await questionsService.list(query);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await questionsService.getById(req.params.id);
      // Hide correct_answer unless admin
      const { correctAnswer, aiExplanation, ...safeQuestion } = question;
      const payload = req.user?.isAdmin
        ? question
        : safeQuestion;
      res.json({ success: true, data: payload });
    } catch (err) { next(err); }
  },

  async getSubjects(_req: Request, res: Response, next: NextFunction) {
    try {
      const subjects = await questionsService.getSubjects();
      res.json({ success: true, data: subjects });
    } catch (err) { next(err); }
  },

  async getYears(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, examType } = z.object({
        subject: z.string(),
        examType: z.enum(['WAEC', 'NECO']),
      }).parse(req.query);
      const years = await questionsService.getYears(subject, examType);
      res.json({ success: true, data: years });
    } catch (err) { next(err); }
  },

  async flag(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = z.object({ reason: z.string().min(10) }).parse(req.body);
      await questionsService.flagQuestion(req.params.id, req.user!.userId, reason);
      res.json({ success: true, data: null, message: 'Question reported. Thank you!' });
    } catch (err) { next(err); }
  },

  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await questionsService.adminCreate(req.body);
      res.status(201).json({ success: true, data: question });
    } catch (err) { next(err); }
  },

  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await questionsService.adminUpdate(req.params.id, req.body);
      res.json({ success: true, data: question });
    } catch (err) { next(err); }
  },

  async adminDelete(req: Request, res: Response, next: NextFunction) {
    try {
      await questionsService.adminDelete(req.params.id);
      res.json({ success: true, data: null, message: 'Question deleted' });
    } catch (err) { next(err); }
  },

  async adminBulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { questions } = z.object({ questions: z.array(z.any()).min(1).max(500) }).parse(req.body);
      const result = await questionsService.adminBulkCreate(questions);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};

// ============================================================
// PrepWise — Questions: Routes
// ============================================================

import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// Public
router.get('/subjects',   questionsController.getSubjects);
router.get('/years',      questionsController.getYears);

// Authenticated
router.get('/',           authenticate, questionsController.list);
router.get('/:id',        authenticate, questionsController.getById);
router.post('/:id/flag',  authenticate, questionsController.flag);  // ← single registration only

// Admin
router.post('/',          authenticate, requireAdmin, questionsController.adminCreate);
router.patch('/:id',      authenticate, requireAdmin, questionsController.adminUpdate);
router.delete('/:id',     authenticate, requireAdmin, questionsController.adminDelete);
router.post('/bulk',      authenticate, requireAdmin, questionsController.adminBulkCreate);

export { router as questionsRoutes };