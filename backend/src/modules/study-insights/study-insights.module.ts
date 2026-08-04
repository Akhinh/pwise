import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireTier } from '../../middleware/auth.js'; 
import { generateStudyInsights, getLatestStudyInsights } from './study-insights.service.js';

const router = Router();

// POST /api/v1/study-insights/generate — Premium+ only, same gate as theory mock exams
router.post(
  '/generate',
  authenticate,
  requireTier('PREMIUM'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any).id;
      const insights = await generateStudyInsights(userId);
      res.status(201).json({ success: true, data: insights });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/study-insights — returns the most recently generated insight, or null
router.get('/', authenticate, requireTier('PREMIUM'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any).id;
    const insights = await getLatestStudyInsights(userId);
    res.json({ success: true, data: insights });
  } catch (err) {
    next(err);
  }
});

export const studyInsightsRoutes = router;