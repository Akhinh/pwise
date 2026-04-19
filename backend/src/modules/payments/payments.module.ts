// ============================================================
// PrepWise — Payments Module (Paystack)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { supabaseAdmin } from '../../database/client';

const PAYSTACK_BASE = 'https://api.paystack.co';

const PLAN_CODES: Record<string, string> = {
  STUDENT: process.env.PAYSTACK_PLAN_STUDENT ?? 'PLN_student',
  PREMIUM: process.env.PAYSTACK_PLAN_PREMIUM ?? 'PLN_premium',
  SCHOOL:  process.env.PAYSTACK_PLAN_SCHOOL  ?? 'PLN_school',
};

async function paystackRequest(path: string, method = 'GET', body?: object) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const router = Router();

// POST /subscriptions/initiate — get Paystack authorization URL
router.post('/initiate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan } = z.object({ plan: z.enum(['STUDENT', 'PREMIUM', 'SCHOOL']) }).parse(req.body);

    const data = await paystackRequest('/transaction/initialize', 'POST', {
      email: req.user!.email,
      amount: 0,
      plan: PLAN_CODES[plan],
      metadata: { userId: req.user!.userId, plan },
      callback_url: `${env.urls.web}/subscription/callback`,
    });

    if (!data.status) throw new AppError('Could not initiate payment. Please try again.', 500);
    res.json({ success: true, data: { authorizationUrl: data.data.authorization_url } });
  } catch (err) { next(err); }
});

// POST /subscriptions/cancel
router.post('/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('paystack_subscription_code')
      .eq('user_id', req.user!.userId)
      .eq('status', 'ACTIVE')
      .single();

    if (!sub?.paystack_subscription_code) throw new AppError('No active subscription found', 404);

    await paystackRequest('/subscription/disable', 'POST', {
      code: sub.paystack_subscription_code,
      token: sub.paystack_subscription_code,
    });

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'CANCELLED' })
      .eq('user_id', req.user!.userId)
      .eq('status', 'ACTIVE');

    res.json({ success: true, data: null, message: 'Subscription cancelled. Access continues until end of period.' });
  } catch (err) { next(err); }
});

// GET /subscriptions/current
router.get('/current', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user!.userId)
      .eq('status', 'ACTIVE')
      .single();
    res.json({ success: true, data: data ?? null });
  } catch (err) { next(err); }
});

// POST /webhooks/paystack — Paystack event handler (no auth — verified by HMAC)
router.post('/paystack', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    // req.body is a Buffer because of express.raw() in index.ts
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    // Verify HMAC signature
    const hash = crypto
      .createHmac('sha512', env.paystack.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.warn('[Paystack Webhook] Invalid signature — rejected');
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }

    // Parse event from raw body
    const event = JSON.parse(rawBody.toString());
    console.log('[Paystack Webhook] Received event:', event.event);

    // Log every webhook event for audit
    await supabaseAdmin.from('payments_log').insert({
      event_type: event.event,
      payload: event,
      processed: false,
    });

    // ── Handle subscription creation / successful charge ──────
    if (event.event === 'subscription.create' || event.event === 'charge.success') {
      const meta = event.data.metadata ?? {};
      const userId = meta.userId;
      const plan = meta.plan as string;

      console.log('[Paystack Webhook] userId:', userId, 'plan:', plan);

      if (userId && plan) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 86400 * 1000);

        const { error: upsertError } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            tier: plan,
            paystack_subscription_code: event.data.subscription_code ?? null,
            paystack_customer_code: event.data.customer?.customer_code ?? null,
            status: 'ACTIVE',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) console.error('[Paystack Webhook] Subscription upsert error:', upsertError.message);

        const { error: userError } = await supabaseAdmin
          .from('users')
          .update({
            subscription_tier: plan,
            subscription_expires_at: periodEnd.toISOString(),
          })
          .eq('id', userId);

        if (userError) console.error('[Paystack Webhook] User update error:', userError.message);
        else console.log('[Paystack Webhook] User tier updated to:', plan);
      } else {
        console.warn('[Paystack Webhook] Missing userId or plan in metadata:', meta);
      }
    }

    // ── Handle subscription cancellation ─────────────────────
    if (event.event === 'subscription.disable') {
      const userId = event.data.metadata?.userId;
      if (userId) {
        await supabaseAdmin
          .from('users')
          .update({ subscription_tier: 'FREE', subscription_expires_at: null })
          .eq('id', userId);

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'EXPIRED' })
          .eq('user_id', userId);

        console.log('[Paystack Webhook] User downgraded to FREE:', userId);
      }
    }

    // Mark as processed
    await supabaseAdmin
      .from('payments_log')
      .update({ processed: true })
      .eq('event_type', event.event);

  } catch (err) {
    console.error('[Paystack Webhook] Fatal error:', err);
  }

  // Always return 200 so Paystack doesn't retry
  res.sendStatus(200);
});

export { router as paymentsRoutes };