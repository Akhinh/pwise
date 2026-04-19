// ============================================================
// PrepWise — Shared Utilities
// ============================================================

import type { SubscriptionTier } from '@prepwise/types';

// ── Score helpers ─────────────────────────────────────────────

export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 80) return { grade: 'A', color: '#16a34a' };
  if (score >= 70) return { grade: 'B', color: '#2563eb' };
  if (score >= 60) return { grade: 'C', color: '#d97706' };
  if (score >= 50) return { grade: 'D', color: '#ea580c' };
  return { grade: 'F', color: '#dc2626' };
}

// ── Time helpers ─────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Subscription helpers ──────────────────────────────────────

export function tierLabel(tier: SubscriptionTier): string {
  const labels: Record<SubscriptionTier, string> = {
    FREE: 'Free',
    STUDENT: 'Student',
    PREMIUM: 'Premium',
    SCHOOL: 'School',
  };
  return labels[tier];
}

export function tierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    FREE: '#6b7280',
    STUDENT: '#2563eb',
    PREMIUM: '#7c3aed',
    SCHOOL: '#059669',
  };
  return colors[tier];
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'FREE';
}

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: 'mock_exam' | 'offline' | 'ai_chat' | 'analytics_export' | 'unlimited_questions',
): boolean {
  const access: Record<typeof feature, SubscriptionTier[]> = {
    unlimited_questions: ['STUDENT', 'PREMIUM', 'SCHOOL'],
    offline: ['STUDENT', 'PREMIUM', 'SCHOOL'],
    mock_exam: ['PREMIUM', 'SCHOOL'],
    ai_chat: ['PREMIUM', 'SCHOOL'],
    analytics_export: ['PREMIUM', 'SCHOOL'],
  };
  return access[feature].includes(tier);
}

// ── String helpers ────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ── Validation helpers ────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

// ── Array helpers ─────────────────────────────────────────────

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
