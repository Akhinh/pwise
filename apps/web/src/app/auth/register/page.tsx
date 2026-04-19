'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@prepwise/api-client';
import { useAuthStore } from '@/store/auth.store';

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8)          errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password))      errors.push('At least one uppercase letter');
  if (!/[0-9]/.test(password))      errors.push('At least one number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character (e.g. @, #, !)');
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const update = (field: string, val: string) => {
    setForm(p => ({ ...p, [field]: val }));
    if (field === 'password') setPasswordErrors(validatePassword(val));
  };

  async function handleRegister() {
    if (!form.displayName || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const errors = validatePassword(form.password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      toast.error('Password does not meet requirements');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.register(form.email, form.password, form.displayName);
      if (!res.success) {
        // Show actual backend error message, not generic one
        toast.error((res as any).error ?? 'Registration failed. Please try again.');
        return;
      }
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Welcome to PrepWise! 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const passwordRules = [
    { label: 'At least 8 characters',              test: (p: string) => p.length >= 8 },
    { label: 'At least one uppercase letter',       test: (p: string) => /[A-Z]/.test(p) },
    { label: 'At least one number',                 test: (p: string) => /[0-9]/.test(p) },
    { label: 'At least one special character',      test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="w-full max-w-[400px] animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/">
            <span style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-black text-[#0D2137]">PrepWise</span>
          </Link>
          <p className="text-sm text-gray-400 mt-1">Free forever. No credit card needed.</p>
        </div>

        <div className="bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-bold text-[#0D2137] mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 mb-7">Join thousands of Nigerian students</p>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#0D2137] mb-1.5 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={e => update('displayName', e.target.value)}
                placeholder="e.g. Dubem Eni Cyris"
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1E293B] outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#0D2137] mb-1.5 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="you@example.com"
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1E293B] outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#0D2137] mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="Create a strong password"
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-[#1E293B] outline-none transition-all focus:ring-2 placeholder:text-gray-300 ${
                  form.password.length > 0
                    ? passwordErrors.length === 0
                      ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
                      : 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                }`}
              />

              {/* Password rules checklist */}
              {form.password.length > 0 && (
                <div className="mt-2.5 space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {passwordRules.map(rule => {
                    const passed = rule.test(form.password);
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

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-[#F59E0B] text-[#0D2137] py-3 rounded-xl font-black text-sm hover:bg-[#FCD34D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 rounded-full border-2 border-[#0D2137]/30 border-t-[#0D2137] animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </div>

          <p className="text-[10px] text-center text-gray-300 mt-4">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1 border-gray-100" />
            <span className="text-xs text-gray-300">already have an account?</span>
            <hr className="flex-1 border-gray-100" />
          </div>

          <Link href="/auth/login" className="block text-center text-sm font-bold text-[#0D2137] hover:text-[#1A3A5C] transition-colors">
            Log in instead
          </Link>
        </div>

        <p className="text-center mt-5 text-xs text-gray-300">
          <Link href="/" className="hover:text-gray-500 transition-colors">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}