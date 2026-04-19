// ============================================================
// PrepWise — Middleware: AI Usage Limiter
// ============================================================


// NOT USEFUL CODE, AI.MODULE.TS HANDLES THIS BETTER WITH LOGGING AND USAGE ENDPOINT
//IGNORE THIS FILE FOR NOW, MAY DELETE LATER
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../database/client';
import { AppError } from './errorHandler';
import type { SubscriptionTier } from '@prepwise/types';

const AI_LIMITS: Record<SubscriptionTier, number> = {
  FREE:     5,
  STUDENT:  50,
  PREMIUM:  200,
  SCHOOL:   200,
};

export async function aiLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const tier   = req.user!.tier ?? 'FREE';
    const limit  = AI_LIMITS[tier];
    const today  = new Date().toISOString().split('T')[0];

    // Fetch or create today's usage row
    const { data, error } = await supabaseAdmin
      .from('ai_usage_log')
      .select('id, call_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    const callCount = data?.call_count ?? 0;

    if (callCount >= limit) {
      throw new AppError(
        `You have reached your ${limit} AI requests for today. ${tier === 'FREE' ? 'Upgrade to get more.' : 'Resets at midnight.'}`,
        429,
        'AI_LIMIT_REACHED'
      );
    }

    // Increment usage
    if (data) {
      await supabaseAdmin
        .from('ai_usage_log')
        .update({ call_count: callCount + 1 })
        .eq('id', data.id);
    } else {
      await supabaseAdmin
        .from('ai_usage_log')
        .insert({ user_id: userId, date: today, call_count: 1 });
    }

    // Attach remaining to request for response headers
    res.setHeader('X-AI-Requests-Used', callCount + 1);
    res.setHeader('X-AI-Requests-Limit', limit);
    res.setHeader('X-AI-Requests-Remaining', limit - callCount - 1);

    next();
  } catch (err) {
    next(err);
  }
}