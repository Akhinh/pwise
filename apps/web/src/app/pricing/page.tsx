'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { subscriptions } from '@prepwise/api-client';
import { useAuthStore } from '@/store/auth.store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';

const PLANS = [
  {
    id: 'FREE' as const,
    name: 'Free',
    price: '₦0',
    period: 'forever',
    highlight: false,
    features: [
      { text: '10 questions per day', included: true },
      { text: '5 subjects only', included: true },
      { text: '5 AI explanations/day', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Mock exams', included: false },
      { text: 'Offline mode', included: false },
      { text: 'Unlimited questions', included: false },
    ],
  },
  {
    id: 'STUDENT' as const,
    name: 'Student',
    price: '₦500',
    period: '/month',
    highlight: true,
    features: [
      { text: 'Unlimited questions', included: true },
      { text: 'All 15+ subjects', included: true },
      { text: '50 AI explanations/day', included: true },
      { text: 'Full analytics', included: true },
      { text: 'Offline mode', included: true },
      { text: 'Mock exams', included: false },
      { text: 'AI Study Chat', included: false },
    ],
  },
  {
    id: 'PREMIUM' as const,
    name: 'Premium',
    price: '₦1,000',
    period: '/month',
    highlight: false,
    features: [
      { text: 'Everything in Student', included: true },
      { text: 'Unlimited AI explanations', included: true },
      { text: 'Mock exams (3hr simulation)', included: true },
      { text: 'AI Study Chat', included: true },
      { text: 'Analytics export', included: true },
      { text: 'Priority support', included: true },
      { text: '', included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const currentTier = user?.subscriptionTier ?? 'FREE';

  async function handleUpgrade(plan: 'STUDENT' | 'PREMIUM') {
    if (currentTier === plan) return;
    setLoading(plan);
    try {
      const res = await subscriptions.initiate(plan);
      if (!res.success) { toast.error('Failed to initiate payment'); return; }
      // Redirect to Paystack
      window.location.href = res.data.authorizationUrl;
    } catch {
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel? You will keep access until the end of your billing period.')) return;
    const res = await subscriptions.cancel();
    if (res.success) {
      toast.success('Subscription cancelled. You keep access until end of period.');
    } else {
      toast.error('Failed to cancel subscription. Please try again.');
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#0D2137] mb-3" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Upgrade PrepWise
          </h1>
          <p className="text-gray-400">Choose the plan that fits your study goals</p>
          {currentTier !== 'FREE' && (
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mt-3">
              ✓ You are on the <span className="font-black">{currentTier}</span> plan
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {PLANS.map(plan => {
            const isCurrent = currentTier === plan.id;
            const isUpgrade = ['FREE','STUDENT','PREMIUM'].indexOf(plan.id) > ['FREE','STUDENT','PREMIUM'].indexOf(currentTier);

            return (
              <div key={plan.id} className={`bg-white rounded-[20px] p-6 relative flex flex-col ${
                plan.highlight
                  ? 'border-2 border-[#0D2137] shadow-xl'
                  : 'border border-gray-200'
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#0D2137] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Current Plan
                  </div>
                )}

                <div className="mb-5">
                  <p className="text-base font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{plan.name}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{plan.price}</span>
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  </div>
                </div>

                {/* CTA */}
                {plan.id === 'FREE' ? (
                  <div className={`py-2.5 rounded-xl text-sm font-bold text-center mb-5 ${isCurrent ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-[#0D2137]'}`}>
                    {isCurrent ? 'Current plan' : 'Free forever'}
                  </div>
                ) : (
                  <button
                    onClick={() => isUpgrade && handleUpgrade(plan.id as 'STUDENT' | 'PREMIUM')}
                    disabled={isCurrent || !isUpgrade || loading === plan.id}
                    className={`py-2.5 rounded-xl text-sm font-bold mb-5 flex items-center justify-center gap-2 transition-colors ${
                      isCurrent
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : !isUpgrade
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : plan.highlight
                            ? 'bg-[#0D2137] text-white hover:bg-[#1A3A5C]'
                            : 'bg-[#F59E0B] text-[#0D2137] hover:bg-[#FCD34D]'
                    }`}
                  >
                    {loading === plan.id ? <Spinner size={16} /> : null}
                    {isCurrent ? '✓ Active' : !isUpgrade ? 'Downgrade' : `Upgrade to ${plan.name} →`}
                  </button>
                )}

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.filter(f => f.text).map(f => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      <span className={`flex-shrink-0 font-bold mt-0.5 ${f.included ? 'text-green-500' : 'text-gray-300'}`}>
                        {f.included ? '✓' : '✗'}
                      </span>
                      <span className={f.included ? 'text-gray-600' : 'text-gray-300'}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* School plan */}
        <div className="bg-[#0D2137] rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-white font-black text-lg" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>School Plan — ₦10,000/month</p>
            <p className="text-white/60 text-sm mt-1">Bulk student accounts for schools, coaching centres &amp; study groups. Up to 100 students.</p>
          </div>
          <a href="mailto:theprepwise@gmail.com" className="flex-shrink-0 bg-[#F59E0B] text-[#0D2137] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#FCD34D] transition-colors whitespace-nowrap">
            Contact Us →
          </a>
        </div>

        {/* Payment info */}
        <div className="text-center text-sm text-gray-400 space-y-1">
          <p>All payments processed securely via <strong className="text-[#0D2137]">Paystack</strong></p>
          <p>Bank transfer · USSD · Debit &amp; Credit cards accepted</p>
          <p>Cancel anytime — access continues until end of billing period</p>
          {currentTier !== 'FREE' && (
            <button onClick={handleCancel} className="mt-3 text-xs text-red-400 hover:text-red-600 underline transition-colors">
              Cancel subscription
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
