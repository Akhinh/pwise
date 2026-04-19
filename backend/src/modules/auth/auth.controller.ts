// ============================================================
// PrepWise — Auth: Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';


const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g. @, #, !)');

const registerSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .transform(val => val.trim().toLowerCase()),
  password: passwordSchema,
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const body = registerSchema.parse(req.body);
      const result = await authService.register(body.email, body.password, body.displayName);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body.email, body.password);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async logout(_req: Request, res: Response) {
    // Client discards the token; stateless JWT — nothing to invalidate server-side
    // For production: add token to a Redis blocklist
    res.json({ success: true, data: null, message: 'Logged out successfully' });
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z.object({
        displayName: z.string().min(2).max(100).optional(),
        avatarUrl: z.string().url().optional(),
      }).parse(req.body);
      const user = await authService.updateProfile(req.user!.userId, body);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      await authService.forgotPassword(email);
      // Always return success — don't reveal if email exists
      res.json({ success: true, data: null, message: 'If this email exists, a reset link has been sent.' });
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z.object({
        accessToken: z.string(),
        newPassword: passwordSchema,
      }).parse(req.body);
      await authService.resetPassword(body.accessToken, body.newPassword);
      res.json({ success: true, data: null, message: 'Password reset successfully' });
    } catch (err) { next(err); }
  },
};
