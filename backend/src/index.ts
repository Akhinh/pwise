// ============================================================
// PrepWise — Backend Entry Point
// ============================================================

import dotenv from 'dotenv';
import path from 'path';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { questionsRoutes } from './modules/questions/questions.routes';
import { quizRoutes } from './modules/quiz/quiz.module';
import { aiRoutes } from './modules/ai/ai.module';
import { progressRoutes, leaderboardRoutes } from './modules/progress/progress.module';
import { paymentsRoutes } from './modules/payments/payments.module';

const app = express();

// ── Security & Utilities ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [env.urls.web, env.urls.admin],
  credentials: true,
}));
app.use(compression());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Paystack webhook MUST receive raw body for HMAC verification
// This must come BEFORE express.json()
app.use('/api/v1/webhooks/paystack', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' }));

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'prepwise-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: env.nodeEnv,
  });
});

// ── API Routes ────────────────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`,          authRoutes);
app.use(`${v1}/questions`,     questionsRoutes);
app.use(`${v1}/quiz`,          quizRoutes);
app.use(`${v1}/ai`,            aiRoutes);
app.use(`${v1}/progress`,      progressRoutes);
app.use(`${v1}/leaderboard`,   leaderboardRoutes);
app.use(`${v1}/subscriptions`, paymentsRoutes);
app.use(`${v1}/webhooks`,      paymentsRoutes);

// ── 404 & Error Handling ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║        PrepWise API Server               ║
╠══════════════════════════════════════════╣
║  Status  : Running                       ║
║  Port    : ${env.port}                           ║
║  Env     : ${env.nodeEnv.padEnd(30)}  ║
║  Health  : http://localhost:${env.port}/health  ║
╚══════════════════════════════════════════╝
  `);
});

export default app;