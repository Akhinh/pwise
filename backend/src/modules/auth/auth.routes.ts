// ============================================================
// PrepWise — Auth: Routes
// ============================================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Strict rate limit on auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many attempts. Please wait 15 minutes.', statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register',       authLimiter, authController.register);
router.post('/login',          authLimiter, authController.login);
router.post('/logout',         authenticate, authController.logout);
router.post('/refresh',        authLimiter, authController.refresh);
router.post('/forgot-password',authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/me',              authenticate, authController.me);
router.patch('/me',            authenticate, authController.updateMe);

export { router as authRoutes };
