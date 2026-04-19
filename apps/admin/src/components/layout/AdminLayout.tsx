'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminAuth } from '@/lib/auth';

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',         icon: '◈' },
  { href: '/questions',  label: 'Questions',          icon: '❓' },
  { href: '/users',      label: 'Users',              icon: '👥' },
  { href: '/flagged',    label: 'Flagged Questions',  icon: '🚩' },
  { href: '/ai-usage',   label: 'AI Usage',           icon: '✨' },
  { href: '/payments',   label: 'Payments',           icon: '💳' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, email, logout } = useAdminAuth();

  useEffect(() => {
    if (!isLoggedIn) router.push('/auth');
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0D2137] flex flex-col sticky top-0 h-screen flex-shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-bold text-lg">PrepWise</p>
          <p className="text-white/40 text-xs mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-[#F59E0B]/20 text-[#FCD34D]' : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`}>
                <span className="w-5 text-center">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <p className="text-xs text-white/40 px-3 mb-1 truncate">{email}</p>
          <button onClick={() => { logout(); router.push('/auth'); }}
            className="w-full text-left px-3 py-2 text-xs text-white/40 hover:text-white/70 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
