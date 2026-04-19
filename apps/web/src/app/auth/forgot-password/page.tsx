'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { auth } from '@prepwise/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email) { toast.error('Please enter your email address'); return; }
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="w-full max-w-[400px] animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/">
            <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-black text-[#0D2137]">PrepWise</span>
          </Link>
          <p className="text-sm text-gray-400 mt-1">WAEC &amp; NECO Exam Preparation</p>
        </div>

        <div className="bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
          {sent ? (
            // ── Success state ──────────────────────────────────
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-bold text-[#0D2137] mb-2">
                Check your email
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                If <strong className="text-[#0D2137]">{email}</strong> is registered, you'll receive a password reset link shortly.
              </p>
              <p className="text-xs text-gray-300 mb-6">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-blue-600 hover:underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            // ── Form state ─────────────────────────────────────
            <>
              <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-bold text-[#0D2137] mb-1">
                Forgot password?
              </h1>
              <p className="text-sm text-gray-400 mb-7">
                Enter your email and we'll send you a reset link.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0D2137] mb-1.5 uppercase tracking-wide">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1E293B] outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-[#0D2137] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1A3A5C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-5 text-xs text-gray-300">
          <Link href="/auth/login" className="hover:text-gray-500 transition-colors">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}