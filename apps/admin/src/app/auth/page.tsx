'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    const ok = login(email, password);
    if (ok) { toast.success('Welcome back'); router.push('/dashboard'); }
    else toast.error('Invalid credentials');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D2137]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-white">PrepWise</p>
          <p className="text-white/50 text-sm mt-1">Admin Panel</p>
        </div>
        <div className="bg-white rounded-2xl p-8">
          <h1 className="text-xl font-bold text-[#0D2137] mb-6">Sign In</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@prepwise.ng"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <button onClick={handleLogin}
              className="w-full bg-[#0D2137] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1A3A5C] transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
