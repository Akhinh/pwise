'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@prepwise/api-client';

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8)              errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password))          errors.push('At least one uppercase letter');
  if (!/[0-9]/.test(password))          errors.push('At least one number');
  if (!/[^A-Za-z0-9]/.test(password))   errors.push('At least one special character (e.g. @, #, !)');
  return errors;
}

const passwordRules = [
  { label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one number',             test: (p: string) => /[0-9]/.test(p) },
  { label: 'At least one special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function ResetPasswordPage() {
  const router = useRouter();

  const [accessToken, setAccessToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase sends token as hash fragment: #access_token=xxx&type=recovery
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // remove the #
    const token = params.get('access_token');
    const type = params.get('type');

    if (token && type === 'recovery') {
      setAccessToken(token);
    }
  }, []);

  async function handleReset() {
    if (!accessToken) {
      toast.error('Invalid or expired reset link. Please request a new one.');
      return;
    }
    const errors = validatePassword(password);
    if (errors.length > 0) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.resetPassword(accessToken, password);
      if (!res.success) {
        toast.error((res as any).error ?? 'Failed to reset password. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="w-full max-w-[400px] animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-black text-[#0D2137]">PrepWise</span>
          </Link>
          <p className="text-sm text-gray-400 mt-1">WAEC &amp; NECO Exam Preparation</p>
        </div>

        <div className="bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
          {done ? (
            // ── Success state ────────────────────────────────
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-bold text-[#0D2137] mb-2">
                Password reset!
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                Your password has been updated successfully.
              </p>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-[#F59E0B] text-[#0D2137] py-3 rounded-xl font-black text-sm hover:bg-[#FCD34D] transition-colors"
              >
                Log in with new password →
              </button>
            </div>
          ) : (
            // ── Form state ───────────────────────────────────
            <>
              <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-bold text-[#0D2137] mb-1">
                Reset password
              </h1>
              <p className="text-sm text-gray-400 mb-7">
                Create a new strong password for your account.
              </p>

              {/* Invalid token warning */}
              {!accessToken && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 mb-4">
                  Invalid or expired reset link. Please{' '}
                  <Link href="/auth/forgot-password" className="underline font-bold">request a new one</Link>.
                </div>
              )}

              <div className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-[#0D2137] mb-1.5 uppercase tracking-wide">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#1E293B] outline-none transition-all focus:ring-2 placeholder:text-gray-300 ${
                      password.length > 0
                        ? validatePassword(password).length === 0
                          ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
                          : 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                    }`}
                  />

                  {/* Live password rules checklist */}
                  {password.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {passwordRules.map(rule => {
                        const passed = rule.test(password);
                        return (
                          <div key={rule.label} className="flex items-center gap-2">
                            <span className={`text-xs font-bold flex-shrink-0 ${passed ? 'text-green-500' : 'text-red-400'}`}>
                              {passed ? '✓' : '✗'}
                            </span>
                            <span className={`text-xs ${passed ? 'text-green-600' : 'text-red-400'}`}>
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-[#0D2137] mb-1.5 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#1E293B] outline-none transition-all focus:ring-2 placeholder:text-gray-300 ${
                      confirm.length > 0
                        ? confirm === password
                          ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
                          : 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                    }`}
                  />
                  {confirm.length > 0 && confirm !== password && (
                    <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  disabled={loading || !accessToken}
                  className="w-full bg-[#F59E0B] text-[#0D2137] py-3 rounded-xl font-black text-sm hover:bg-[#FCD34D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <div className="w-4 h-4 rounded-full border-2 border-[#0D2137]/30 border-t-[#0D2137] animate-spin" />}
                  {loading ? 'Resetting...' : 'Reset Password →'}
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

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" />
      </div>
    }>
      <ResetPasswordPage />
    </Suspense>
  );
}