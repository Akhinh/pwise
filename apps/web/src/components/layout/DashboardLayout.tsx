'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { TierBadge, Spinner } from '@/components/ui';
import { OfflineBanner } from '@/components/OfflineBanner';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',   icon: '◈' },
  { href: '/quiz',         label: 'Practice',    icon: '◎' },
  { href: '/progress',     label: 'Progress',    icon: '◐' },
  { href: '/leaderboard',  label: 'Leaderboard', icon: '◆' },
  { href: '/pricing',      label: 'Upgrade',     icon: '◉' },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
        <Spinner size={32} />
      </div>
    );
  }

  const initials = user.displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F4F8]">

      {/* ── Offline Banner — sits above everything ── */}
      <OfflineBanner />

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside className="w-[220px] flex-shrink-0 bg-[#0D2137] flex flex-col sticky top-0 h-screen">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/10">
            <Link href="/dashboard" className="block">
              <span className="font-display text-xl font-bold text-white tracking-tight">PrepWise</span>
              <span className="block text-[10px] text-white/40 mt-0.5 tracking-widest uppercase">WAEC · NECO</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${active
                      ? 'bg-[#F59E0B]/20 text-[#FCD34D]'
                      : 'text-white/60 hover:bg-white/8 hover:text-white'
                    }`}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User pill */}
          <div className="p-3 border-t border-white/10">
            <Link href="/profile" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center text-xs font-bold text-[#0D2137] flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.displayName}</p>
                <TierBadge tier={user.subscriptionTier} />
              </div>
            </Link>
            <button
              onClick={() => { clearAuth(); router.push('/'); }}
              className="mt-1.5 w-full text-left px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors rounded-lg"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}