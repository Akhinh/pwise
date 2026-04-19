// ============================================================
// PrepWise — Middleware: JWT Authentication
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { SubscriptionTier } from '@prepwise/types';
import { supabaseAdmin } from '../database/client';


export interface AuthPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  isAdmin: boolean;
}

// Attach to Request so controllers can read req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// middleware/auth.ts
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided', statusCode: 401 });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwt.secret) as AuthPayload;
    
    // Always fetch fresh tier from DB — don't trust JWT tier
    supabaseAdmin
      .from('users')
      .select('subscription_tier, is_admin')
      .eq('id', payload.userId)
      .single()
      .then(({ data }) => {
        req.user = {
          ...payload,
          tier: (data?.subscription_tier ?? 'FREE') as SubscriptionTier,
          isAdmin: data?.is_admin ?? false,
        };
        next();
      }, () => {
        // Fall back to JWT values if DB call fails
        req.user = payload;
        next();
      });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token', statusCode: 401 });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ success: false, error: 'Admin access required', statusCode: 403 });
    return;
  }
  next();
}

export function requireTier(minTier: SubscriptionTier) {
  const tierRank: Record<SubscriptionTier, number> = {
    FREE: 0, STUDENT: 1, PREMIUM: 2, SCHOOL: 3,
  };
  return (req: Request, res: Response, next: NextFunction): void => {
    const userTier = req.user?.tier ?? 'FREE';
    if (tierRank[userTier] < tierRank[minTier]) {
      res.status(403).json({
        success: false,
        error: `This feature requires ${minTier} subscription or higher`,
        code: 'UPGRADE_REQUIRED',
        statusCode: 403,
      });
      return;
    }
    next();
  };
}
