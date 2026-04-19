// ============================================================
// PrepWise — Shared API Client
// Used by both the web app and mobile app.
// Set API_BASE_URL in your environment before using.
// ============================================================

import type {
  ApiResponse, PaginatedResponse, User, Question, QuestionForQuiz,
  QuizSession, QuizResult, ProgressSummary, SubjectProgress,
  ActivityDataPoint, AiExplanation, AiChatMessage, Subscription,
  ExamType, QuizMode, Difficulty,
} from '@prepwise/types';

let accessToken: string | null = null;
let apiBaseUrl = '';

export function configureApiClient(baseUrl: string, token?: string) {
  apiBaseUrl = baseUrl;
  if (token) accessToken = token;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// ── Core fetch wrapper ───────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  try {
    const res = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
    const data = await res.json();
    return data as ApiResponse<T>;
  } catch (err) {
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      statusCode: 0,
    };
  }
}

// ── Auth ─────────────────────────────────────────────────────

export const auth = {
  register: (email: string, password: string, displayName: string) =>
    request<{ user: User; accessToken: string; refreshToken: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    request<{ user: User; accessToken: string; refreshToken: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<null>('/api/v1/auth/logout', { method: 'POST' }),

  me: () =>
    request<User>('/api/v1/auth/me'),

  updateProfile: (data: Partial<Pick<User, 'displayName' | 'avatarUrl'>>) =>
    request<User>('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  forgotPassword: (email: string) =>
    request<null>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (accessToken: string, newPassword: string) =>
    request<null>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ accessToken, newPassword }),  // ← was { otp, newPassword }
  }),
};

// ── Questions ────────────────────────────────────────────────

export interface QuestionFilters {
  subject?: string;
  year?: number;
  examType?: ExamType;
  topic?: string;
  difficulty?: Difficulty;
  page?: number;
  limit?: number;
}

export const questions = {
  list: (filters: QuestionFilters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    return request<PaginatedResponse<Question>>(`/api/v1/questions?${params}`);
  },

  getById: (id: string) =>
    request<Question>(`/api/v1/questions/${id}`),

  getSubjects: () =>
  request<string[]>('/api/v1/questions/subjects'),

  getYears: (subject: string, examType: ExamType) =>
    request<number[]>(`/api/v1/questions/years?subject=${subject}&examType=${examType}`),

  flag: (id: string, reason: string) =>
    request<null>(`/api/v1/questions/${id}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ── Quiz ─────────────────────────────────────────────────────

export interface StartQuizOptions {
  mode: QuizMode;
  subject: string;
  examType: ExamType;
  year?: number;
  questionCount?: number;
  timeLimitMinutes?: number;
}

export const quiz = {
  start: (options: StartQuizOptions) =>
    request<{ session: QuizSession; questions: QuestionForQuiz[] }>('/api/v1/quiz/start', {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  submitAnswer: (sessionId: string, questionId: string, selectedOption: string | null, timeSpentSeconds: number) =>
    request<{ isCorrect: boolean; correctAnswer: string }>(`/api/v1/quiz/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedOption, timeSpentSeconds }),
    }),

  complete: (sessionId: string) =>
    request<QuizResult>(`/api/v1/quiz/${sessionId}/complete`, { method: 'POST' }),

  resume: (sessionId: string) =>
    request<{ session: QuizSession; questions: QuestionForQuiz[]; answeredIds: string[] }>(
      `/api/v1/quiz/${sessionId}`
    ),

  history: (page = 1) =>
    request<PaginatedResponse<QuizSession>>(`/api/v1/quiz/history?page=${page}`),

  getReport: (sessionId: string) =>
    request<QuizResult>(`/api/v1/quiz/${sessionId}/report`),
};

// ── AI ───────────────────────────────────────────────────────

export const ai = {
  explain: (questionId: string, selectedOption: string) =>
    request<AiExplanation>('/api/v1/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedOption }),
    }),

  chat: (messages: Pick<AiChatMessage, 'role' | 'content'>[], subject: string) =>
    request<{ reply: string }>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, subject }),
    }),

  getUsage: () =>
    request<{ used: number; limit: number }>('/api/v1/ai/usage'),
};

// ── Progress ─────────────────────────────────────────────────

export const progress = {
  summary: () =>
    request<ProgressSummary>('/api/v1/progress/summary'),

  subjects: () =>
    request<SubjectProgress[]>('/api/v1/progress/subjects'),

  activity: (days: 7 | 30 = 7) =>
    request<ActivityDataPoint[]>(`/api/v1/progress/activity?days=${days}`),
};

// ── Leaderboard ──────────────────────────────────────────────

export const leaderboard = {
  get: (subject?: string) => {
    const q = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return request<Array<{ rank: number; user: Pick<User, 'id' | 'displayName' | 'avatarUrl'>; score: number }>>(
      `/api/v1/leaderboard${q}`
    );
  },
};

// ── Subscriptions ────────────────────────────────────────────

export const subscriptions = {
  initiate: (plan: 'STUDENT' | 'PREMIUM' | 'SCHOOL') =>
    request<{ authorizationUrl: string }>('/api/v1/subscriptions/initiate', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  cancel: () =>
    request<null>('/api/v1/subscriptions/cancel', { method: 'POST' }),

  getCurrent: () =>
    request<Subscription | null>('/api/v1/subscriptions/current'),
};
