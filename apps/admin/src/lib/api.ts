export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
let _token: string | null = null;
export function setAdminToken(t: string | null) { _token = t; }
export function getAdminToken() { return _token; }

async function req<T>(path: string, opts: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  try {
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
    const data = await res.json();
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/auth/login';
    }
    return data;
  } catch { return { success: false, error: 'Network error' }; }
}

export const authApi = {
  login: (email: string, password: string) =>
    req<{ user: AdminUser; accessToken: string; refreshToken: string }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req<AdminUser>('/api/v1/auth/me'),
};
export const dashboardApi = { stats: () => req<DashboardStats>('/api/v1/admin/stats') };
export const questionsApi = {
  list: (params: { page?: number; subject?: string; examType?: string; year?: number; search?: string; isVerified?: string }) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]));
    return req<PaginatedResponse<Question>>(`/api/v1/admin/questions?${q}`);
  },
  get: (id: string) => req<Question>(`/api/v1/admin/questions/${id}`),
  update: (id: string, data: any) => req<Question>(`/api/v1/admin/questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => req<null>(`/api/v1/admin/questions/${id}`, { method: 'DELETE' }),
  verify: (id: string) => req<Question>(`/api/v1/admin/questions/${id}/verify`, { method: 'POST' }),
  bulkDelete: (ids: string[]) => req<{ deleted: number }>('/api/v1/admin/questions/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
};
export const usersApi = {
  list: (params: { page?: number; search?: string; tier?: string }) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]));
    return req<PaginatedResponse<AdminUser>>(`/api/v1/admin/users?${q}`);
  },
  updateTier: (id: string, tier: string) => req<AdminUser>(`/api/v1/admin/users/${id}/tier`, { method: 'PATCH', body: JSON.stringify({ tier }) }),
  setAdmin: (id: string, isAdmin: boolean) => req<AdminUser>(`/api/v1/admin/users/${id}/admin`, { method: 'PATCH', body: JSON.stringify({ isAdmin }) }),
};
export const flaggedApi = {
  list: (params: { page?: number; status?: string }) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v).map(([k, v]) => [k, String(v)]));
    return req<PaginatedResponse<FlaggedQuestion>>(`/api/v1/admin/flagged?${q}`);
  },
  resolve: (id: string, status: 'FIXED' | 'DISMISSED', adminNote?: string) =>
    req<FlaggedQuestion>(`/api/v1/admin/flagged/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, adminNote }) }),
};
export const analyticsApi = {
  overview: (days = 30) => req<AnalyticsOverview>(`/api/v1/admin/analytics?days=${days}`),
};

export interface AdminUser { id: string; email: string; displayName: string; subscriptionTier: string; subscriptionExpiresAt?: string | null; streakCount: number; isAdmin: boolean; createdAt: string; updatedAt: string; }
export interface Question { id: string; examType: string; examSession: string; subject: string; year: number; questionText: string; questionImageUrl?: string | null; options: Record<string, string>; correctAnswer: string; aiExplanation?: string | null; topic?: string | null; difficulty: string; isVerified: boolean; isActive: boolean; timesAnswered: number; timesCorrect: number; createdAt: string; }
export interface FlaggedQuestion { id: string; questionId: string; question: Question; userId: string; user: AdminUser; reason: string; status: string; adminNote?: string | null; createdAt: string; }
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; limit: number; hasMore: boolean; }
export interface DashboardStats { totalUsers: number; totalQuestions: number; totalSessions: number; activeToday: number; newUsersThisWeek: number; verifiedQuestions: number; pendingFlags: number; revenueThisMonth: number; usersByTier: Record<string, number>; sessionsLast7Days: Array<{ date: string; count: number }>; }
export interface AnalyticsOverview { dailyActiveUsers: Array<{ date: string; count: number }>; sessionsBySubject: Array<{ subject: string; count: number }>; scoreDistribution: Array<{ range: string; count: number }>; topSubjects: Array<{ subject: string; sessions: number; avgScore: number }>; }
