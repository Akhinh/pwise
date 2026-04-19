// ============================================================
// PrepWise — Shared TypeScript Types
// These interfaces are used by backend, web, and mobile.
// ============================================================

// ── Enums ───────────────────────────────────────────────────

export type ExamType = 'WAEC' | 'NECO';
export type ExamSession = 'MAY_JUNE' | 'GCE' | 'JUNE_JULY';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuizMode = 'PRACTICE' | 'TIMED' | 'MOCK' | 'TOPIC_DRILL' | 'WEAK_AREAS';
export type SubscriptionTier = 'FREE' | 'STUDENT' | 'PREMIUM' | 'SCHOOL';
export type FlagStatus = 'PENDING' | 'REVIEWED' | 'FIXED' | 'DISMISSED';

// ── Question ────────────────────────────────────────────────

export interface QuestionOption {
  A: string;
  B: string;
  C: string;
  D: string;
  E?: string;
}

export interface Question {
  id: string;
  examType: ExamType;
  examSession: ExamSession;
  subject: string;
  year: number;
  questionText: string;
  questionImageUrl?: string | null;
  options: QuestionOption;
  correctAnswer: keyof QuestionOption;
  aiExplanation?: string | null;
  topic?: string | null;
  difficulty: Difficulty;
  sourceUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// When serving questions in a quiz, we hide the correct answer
export type QuestionForQuiz = Omit<Question, 'correctAnswer' | 'aiExplanation'>;

// ── User ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string | null;
  streakCount: number;
  lastActiveAt?: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  passwordHash?: string | null;
}

// ── Quiz Session ─────────────────────────────────────────────

export interface QuizSession {
  id: string;
  userId: string;
  mode: QuizMode;
  subject: string;
  examType: ExamType;
  questionIds: string[];
  startedAt: string;
  completedAt?: string | null;
  totalScore?: number | null;
  isAbandoned: boolean;
}

export interface UserAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedOption?: keyof QuestionOption | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  aiExplanationViewed: boolean;
}

// ── Quiz Report ──────────────────────────────────────────────

export interface QuizResult {
  session: QuizSession;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalScore: number;            // percentage
  timeTakenSeconds: number;
  answers: Array<{
    question: Question;
    selectedOption?: keyof QuestionOption | null;
    isCorrect: boolean;
    aiExplanation?: string | null;
  }>;
}

// ── Progress ─────────────────────────────────────────────────

export interface ProgressSummary {
  streakCount: number;
  totalQuestionsAnswered: number;
  averageScore: number;
  subjectCount: number;
  badges: Badge[];
}

export interface SubjectProgress {
  subject: string;
  questionsAnswered: number;
  accuracyPercent: number;
  lastPracticedAt?: string | null;
}

export interface ActivityDataPoint {
  date: string;           // ISO date string e.g. "2026-03-28"
  questionsAnswered: number;
  sessionsCompleted: number;
}

// ── Badges ──────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  awardedAt: string;
}

// ── Subscription & Payments ──────────────────────────────────

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  paystackSubscriptionCode: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

// ── Subject ──────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  examTypes: ExamType[];
  isActive: boolean;
}

// ── API Response Wrappers ────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ── AI ───────────────────────────────────────────────────────

export interface AiExplanation {
  questionId: string;
  explanation: string;
  quickTip: string;
  cached: boolean;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ── Flagged Question ─────────────────────────────────────────

export interface FlaggedQuestion {
  id: string;
  questionId: string;
  userId: string;
  reason: string;
  status: FlagStatus;
  adminNote?: string | null;
  createdAt: string;
}
