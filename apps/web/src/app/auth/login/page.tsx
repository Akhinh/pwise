'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@prepwise/api-client';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await auth.login(email, password);
      if (!res.success) { toast.error((res as any).error); return; }
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } finally { setLoading(false); }
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

        {/* Card */}
        <div className="bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }} className="text-2xl font-bold text-[#0D2137] mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-7">Log in to continue practising</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0D2137] mb-1.5 uppercase tracking-wide">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1E293B] outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#0D2137] uppercase tracking-wide">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1E293B] outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#0D2137] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1A3A5C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-gray-100" />
            <span className="text-xs text-gray-300">or</span>
            <hr className="flex-1 border-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-[#0D2137] font-bold hover:text-[#1A3A5C]">Sign up free</Link>
          </p>
        </div>

        {/* Back */}
        <p className="text-center mt-5 text-xs text-gray-300">
          <Link href="/" className="hover:text-gray-500 transition-colors">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
