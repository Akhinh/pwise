// ============================================================
// PrepWise — AI Module (Claude API integration)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, requireTier } from '../../middleware/auth';
import { questionsRepository } from '../questions/questions.repository';
import { cacheIncr } from '../../database/redis';
import { supabaseAdmin } from '../../database/client';

// ── Validate API key format before initializing client ────────
function isValidAnthropicKey(key: string | undefined): boolean {
  return !!key && key.startsWith('sk-ant-') && key.length > 20;
}

const anthropic = isValidAnthropicKey(env.anthropic.apiKey)
  ? new Anthropic({ apiKey: env.anthropic.apiKey })
  : null;

if (!anthropic) {
  console.warn('[AI Module] Anthropic API key is missing or invalid — AI generation disabled, placeholder text will be returned.');
}

// ── Tier limits ───────────────────────────────────────────────
const AI_LIMITS: Record<string, number> = {
  FREE:    env.rateLimits.freeAiExplanationsPerDay    ?? 5,
  STUDENT: env.rateLimits.studentAiExplanationsPerDay ?? 50,
  PREMIUM: 200,
  SCHOOL:  200,
};

// ── Placeholder detection ─────────────────────────────────────
const PLACEHOLDER_PATTERNS = [
  '✨ AI Explanation',
  'No official explanation is available',
  'Please check',
  'No explanation available',
];

const PLACEHOLDER_TEXT =
  '✨No official explanation is available for this question at this time. Please check';

function isPlaceholderExplanation(text: string | null | undefined): boolean {
  if (!text) return true;
  return PLACEHOLDER_PATTERNS.some(pattern =>
    text.toLowerCase().includes(pattern.toLowerCase())
  );
}

// ── Rate limit check ──────────────────────────────────────────
async function checkAndIncrementAiUsage(userId: string, tier: string): Promise<number> {
  const limit = AI_LIMITS[tier] ?? 5;
  const today = new Date().toISOString().split('T')[0];
  const key   = `ai:usage:${userId}:${today}`;
  const count = await cacheIncr(key, 86400);

  if (count > limit) {
    const upgradeMsg =
      tier === 'FREE'    ? ' Upgrade to Student (50/day) or Premium (200/day) for more.' :
      tier === 'STUDENT' ? ' Upgrade to Premium for 200 AI requests/day.' :
      ' Resets at midnight.';

    throw new AppError(
      `You've reached your daily AI limit (${limit} requests).${upgradeMsg}`,
      429,
      'AI_LIMIT_REACHED'
    );
  }

  return count;
}

// ── Sync Redis usage to DB ────────────────────────────────────
async function syncUsageToDB(userId: string, count: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await supabaseAdmin
    .from('ai_usage_log')
    .upsert(
      { user_id: userId, date: today, call_count: count },
      { onConflict: 'user_id,date' }
    );
}

// ── AI Service ────────────────────────────────────────────────
export const aiService = {
  async explain(questionId: string, selectedOption: string, userId: string, tier: string) {
    const question = await questionsRepository.findById(questionId);
    if (!question) throw new AppError('Question not found', 404);

    // ── Case 1: No valid API key + placeholder → return placeholder, no limit deducted
    if (!anthropic && isPlaceholderExplanation(question.aiExplanation)) {
      return {
        questionId,
        explanation: PLACEHOLDER_TEXT,
        quickTip: '',
        cached: false,
        generated: false,
      };
    }

    // ── Case 2: Real explanation cached → deduct limit, return cached
    if (question.aiExplanation && !isPlaceholderExplanation(question.aiExplanation)) {
      const count = await checkAndIncrementAiUsage(userId, tier);
      await syncUsageToDB(userId, count);
      return {
        questionId,
        explanation: question.aiExplanation,
        quickTip: '',
        cached: true,
        generated: false,
      };
    }

    // ── Case 3: No valid API key but somehow reached here → placeholder, no limit deducted
    if (!anthropic) {
      return {
        questionId,
        explanation: PLACEHOLDER_TEXT,
        quickTip: '',
        cached: false,
        generated: false,
      };
    }

    // ── Case 4: Valid API key + placeholder/missing → generate with Claude
    const count = await checkAndIncrementAiUsage(userId, tier);

    try {
      const prompt = `You are a helpful Nigerian exam tutor helping an SS3 student prepare for WAEC/NECO.

Question: ${question.questionText}

Options:
${Object.entries(question.options).map(([k, v]) => `${k}. ${v}`).join('\n')}

Correct answer: ${question.correctAnswer}. ${question.options[question.correctAnswer as keyof typeof question.options]}
Student chose: ${selectedOption}. ${question.options[selectedOption as keyof typeof question.options] ?? 'Skipped'}

In 3-4 sentences, explain clearly why the correct answer is right. Use simple English suitable for a Nigerian secondary school student. Be encouraging and educational. End with one sentence Quick Tip for exam technique.

Format your response as:
EXPLANATION: [your explanation here]
QUICK TIP: [one sentence exam tip]`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      });

      const text             = (message.content[0] as { type: string; text: string }).text;
      const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]*?)(?=QUICK TIP:|$)/i);
      const tipMatch         = text.match(/QUICK TIP:\s*([\s\S]*?)$/i);

      const explanation     = explanationMatch?.[1]?.trim() ?? text;
      const quickTip        = tipMatch?.[1]?.trim() ?? '';
      const fullExplanation = quickTip
        ? `${explanation}\n\n💡 Quick Tip: ${quickTip}`
        : explanation;

      // Cache permanently — Claude never called twice for same question
      await questionsRepository.saveAiExplanation(questionId, fullExplanation);
      await syncUsageToDB(userId, count);

      return {
        questionId,
        explanation: fullExplanation,
        quickTip,
        cached: false,
        generated: true,
      };

    } catch (err: unknown) {
      // ── Handle Claude API errors gracefully ──────────────────
      const isAuthError =
        err instanceof Error &&
        (err.message.includes('invalid x-api-key') ||
         err.message.includes('authentication_error') ||
         (err as { status?: number }).status === 401);

      if (isAuthError) {
        console.error('[AI Module] Invalid Anthropic API key — check ANTHROPIC_API_KEY in .env');
        // Don't deduct limit since no value was delivered — decrement back
        const today = new Date().toISOString().split('T')[0];
        const key   = `ai:usage:${userId}:${today}`;
        await cacheIncr(key, 86400); // note: Redis has no decrement here, so just log
        return {
          questionId,
          explanation: PLACEHOLDER_TEXT,
          quickTip: '',
          cached: false,
          generated: false,
        };
      }

      // Re-throw any other unexpected errors
      throw err;
    }
  },

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    subject: string,
    userId: string,
    tier: string
  ) {
    if (!anthropic) {
      throw new AppError(
        'AI Study Chat is not available right now. Please try again later.',
        503,
        'AI_UNAVAILABLE'
      );
    }

    const count = await checkAndIncrementAiUsage(userId, tier);

    try {
      const systemPrompt = `You are PrepWise AI, a helpful and encouraging Nigerian exam tutor. 
You help SS2 and SS3 students prepare for WAEC and NECO exams in ${subject}.
Keep answers concise, clear, and relevant to the Nigerian secondary school curriculum.
Use examples that Nigerian students can relate to. Be encouraging.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      await syncUsageToDB(userId, count);

      return { reply: (response.content[0] as { type: string; text: string }).text };

    } catch (err: unknown) {
      const isAuthError =
        err instanceof Error &&
        (err.message.includes('invalid x-api-key') ||
         err.message.includes('authentication_error') ||
         (err as { status?: number }).status === 401);

      if (isAuthError) {
        console.error('[AI Module] Invalid Anthropic API key — check ANTHROPIC_API_KEY in .env');
        throw new AppError(
          'AI Study Chat is not available right now. Please try again later.',
          503,
          'AI_UNAVAILABLE'
        );
      }

      throw err;
    }
  },

  async getUsage(userId: string, tier: string) {
    const limit = AI_LIMITS[tier] ?? 5;
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabaseAdmin
      .from('ai_usage_log')
      .select('call_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const used = (data?.call_count as number) ?? 0;

    return {
      used,
      limit,
      remaining:   Math.max(0, limit - used),
      resetsAt:    `${today}T23:59:59Z`,
      tier,
      aiAvailable: !!anthropic,
    };
  },

  async classifyTopic(questionId: string): Promise<string | null> {
    if (!anthropic) return null;
 
    const question = await questionsRepository.findById(questionId);
    if (!question) return null;
 
    // Already has a topic — skip
    if (question.topic && question.topic.trim().length > 0) return question.topic;
 
    try {
      const prompt = `You are classifying a Nigerian WAEC/NECO ${question.subject} exam question into a topic.
 
Question: ${question.questionText}
Options: ${Object.entries(question.options).map(([k, v]) => `${k}. ${v}`).join(' | ')}
 
Return ONLY the topic name — 2 to 5 words maximum, no punctuation, no explanation.
Examples: "Organic Chemistry", "Demand and Supply", "Government Structure", "Quadratic Equations", "Cell Biology"
 
Topic:`;
 
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', // Use Haiku — fast and cheap for classification
        max_tokens: 20,
        messages: [{ role: 'user', content: prompt }],
      });
 
      const topic = (message.content[0] as { type: string; text: string }).text
        .trim()
        .replace(/^["']|["']$/g, '') // strip any quotes
        .replace(/\.$/, '');          // strip trailing period
 
      if (topic && topic.length > 0 && topic.length <= 60) {
        // Save topic to DB so this question is never classified again
        await supabaseAdmin
          .from('questions')
          .update({ topic })
          .eq('id', questionId);
 
        return topic;
      }
 
      return null;
    } catch (err) {
      // Silent fail — topic classification is best-effort, never block the user
      console.error('[AI] Topic classification failed for question', questionId, err);
      return null;
    }
  },
};

// ── Controller + Routes ───────────────────────────────────────
const router = Router();

router.post('/explain', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questionId, selectedOption } = z.object({
      questionId:     z.string().uuid(),
      selectedOption: z.string(),
    }).parse(req.body);

    const result = await aiService.explain(
      questionId,
      selectedOption,
      req.user!.userId,
      req.user!.tier
    );

    const usage = await aiService.getUsage(req.user!.userId, req.user!.tier);
    res.setHeader('X-AI-Requests-Used',      usage.used);
    res.setHeader('X-AI-Requests-Limit',     usage.limit);
    res.setHeader('X-AI-Requests-Remaining', usage.remaining);

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/chat', authenticate, requireTier('PREMIUM'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, subject } = z.object({
      messages: z.array(z.object({
        role:    z.enum(['user', 'assistant']),
        content: z.string(),
      })).min(1),
      subject: z.string(),
    }).parse(req.body);

    const result = await aiService.chat(
      messages,
      subject,
      req.user!.userId,
      req.user!.tier
    );

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/usage', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.getUsage(req.user!.userId, req.user!.tier);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/classify-topic', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questionId } = z.object({
      questionId: z.string().uuid(),
    }).parse(req.body);
 
    // Only classify if question has no topic — guard server-side too
    const question = await questionsRepository.findById(questionId);
    if (!question) {
      res.json({ success: true, data: { topic: null } });
      return;
    }
 
    if (question.topic && question.topic.trim().length > 0) {
      res.json({ success: true, data: { topic: question.topic } });
      return;
    }
 
    const topic = await aiService.classifyTopic(questionId);
    res.json({ success: true, data: { topic } });
  } catch (err) { next(err); }
});


export { router as aiRoutes };