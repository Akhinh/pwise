// ============================================================
// PrepWise — Auth: Service (business logic)
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../database/client';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { authRepository } from './auth.repository';
import type { User } from '@prepwise/types';
import type { AuthPayload } from '../../middleware/auth';

export const authService = {
  async register(email: string, password: string, displayName: string) {
    const existing = await authRepository.findByEmail(email);
    if (existing) throw new AppError('An account with this email already exists', 409, 'EMAIL_TAKEN');

    // Hash password — we own this, not Supabase
    const passwordHash = await bcrypt.hash(password, 12);

    // Create in Supabase Auth for session management
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw new AppError(authError.message, 400);

    // Create profile in our users table with matching ID and our own hash
    const user = await authRepository.create(authData.user.id, email, displayName, passwordHash);

    const tokens = generateTokens(user);
    return { user, ...tokens };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    // Verify against our own hash — no Supabase Auth dependency
    const valid = await bcrypt.compare(password, user.passwordHash!);
    if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    await authRepository.update(user.id, { last_active_at: new Date().toISOString() });

    const tokens = generateTokens(user);
    return { user, ...tokens };
  },

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.jwt.refreshSecret) as AuthPayload;
      const user = await authRepository.findById(payload.userId);
      if (!user) throw new AppError('User not found', 404);
      const tokens = generateTokens(user);
      return { user, ...tokens };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  },

  async getMe(userId: string): Promise<User> {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async updateProfile(userId: string, fields: { displayName?: string; avatarUrl?: string }): Promise<User> {
    const updates: Record<string, string> = {};
    if (fields.displayName) updates.display_name = fields.displayName;
    if (fields.avatarUrl) updates.avatar_url = fields.avatarUrl;
    return authRepository.update(userId, updates);
  },

  async forgotPassword(email: string): Promise<void> {
    // This generates the link AND sends the email via Supabase
    await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.urls.web}/auth/reset-password`,
    });
  // We don't reveal whether the email exists (security best practice)
  },

  async resetPassword(accessToken: string, newPassword: string): Promise<void> {
      // Get user from Supabase auth token
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
      if (userError || !user) throw new AppError('Invalid or expired reset link.', 400);

      // Update password in Supabase Auth
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
      if (error) throw new AppError('Failed to reset password. Please try again.', 400);

      // Update our own hash too
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await supabaseAdmin.from('users').update({ password_hash: passwordHash }).eq('id', user.id);
  },
};

function generateTokens(user: User) {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    tier: user.subscriptionTier,
    isAdmin: user.isAdmin,
  };

  const accessToken = jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}