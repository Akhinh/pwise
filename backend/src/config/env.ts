// ============================================================
// PrepWise — Environment Configuration
// All env vars are read once here. Import this, not process.env.
// ============================================================

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '4000'), 10),
  isProduction: process.env.NODE_ENV === 'production',

  supabase: {
    url: required('SUPABASE_URL'),
    anonKey: required('SUPABASE_ANON_KEY'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '1h'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  gemini: {
    apiKey: required('GEMINI_API_KEY'),
  },

  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
  },

  paystack: {
    secretKey: required('PAYSTACK_SECRET_KEY'),
    publicKey: required('PAYSTACK_PUBLIC_KEY'),
    webhookSecret: required('PAYSTACK_WEBHOOK_SECRET'),
  },

  redis: {
    url: required('REDIS_URL'),
  },

  resend: {
    apiKey: required('RESEND_API_KEY'),
    emailFrom: optional('EMAIL_FROM', 'team@prepwise.com.ng'),
  },

  urls: {
    web: optional('WEB_URL', 'http://localhost:3000'),
    admin: optional('ADMIN_URL', 'http://localhost:3001'),
    api: optional('API_URL', 'http://localhost:4000'),
  },

  admin: {
    allowedIps: optional('ADMIN_ALLOWED_IPS', '127.0.0.1').split(',').map((ip) => ip.trim()),
  },

  rateLimits: {
    freeQuestionsPerDay:          parseInt(process.env.FREE_TIER_QUESTIONS_PER_DAY ?? '10'),
    freeAiExplanationsPerDay:     parseInt(process.env.FREE_TIER_AI_EXPLANATIONS_PER_DAY ?? '5'),
    studentAiExplanationsPerDay:  parseInt(process.env.STUDENT_TIER_AI_EXPLANATIONS_PER_DAY ?? '50'),
    premiumAiExplanationsPerDay:  parseInt(process.env.PREMIUM_TIER_AI_EXPLANATIONS_PER_DAY ?? '200'),
  },
} as const;
