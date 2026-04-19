// ============================================================
// PrepWise — Auth: Repository (DB layer)
// ============================================================
import { supabaseAdmin } from '../../database/client';
import type { User } from '@prepwise/types';

export const authRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    return data ? mapUser(data) : null;
  },

  async findById(id: string): Promise<User | null> {
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return data ? mapUser(data) : null;
  },

  async create(id: string, email: string, displayName: string, passwordHash: string): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ id, email, display_name: displayName, password_hash: passwordHash })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapUser(data);
  },

  async update(id: string, fields: Partial<{
    display_name: string;
    avatar_url: string;
    last_active_at: string;
    password_hash: string;
  }>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapUser(data);
  },
};

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string) ?? null,
    passwordHash: (row.password_hash as string) ?? null,
    subscriptionTier: row.subscription_tier as User['subscriptionTier'],
    subscriptionExpiresAt: (row.subscription_expires_at as string) ?? null,
    streakCount: row.streak_count as number,
    lastActiveAt: (row.last_active_at as string) ?? null,
    isAdmin: row.is_admin as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}