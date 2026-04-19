'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';

async function fetchStats() {
  const [users, questions, sessions, flagged, aiUsage] = await Promise.all([
    supabase.from('users').select('id, subscription_tier, created_at', { count: 'exact' }),
    supabase.from('questions').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('quiz_sessions').select('id, total_score', { count: 'exact' }).not('completed_at', 'is', null),
    supabase.from('flagged_questions').select('id', { count: 'exact' }).eq('status', 'PENDING'),
    supabase.from('ai_usage_log').select('call_count'),
  ]);

  const tierBreakdown = (users.data ?? []).reduce((acc: Record<string, number>, u) => {
    acc[u.subscription_tier] = (acc[u.subscription_tier] || 0) + 1;
    return acc;
  }, {});

  const totalAiCalls = (aiUsage.data ?? []).reduce((sum, r) => sum + (r.call_count || 0), 0);
  const scores = (sessions.data ?? []).map(s => s.total_score).filter(Boolean);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const recentUsers = (users.data ?? [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return {
    totalUsers: users.count ?? 0,
    totalQuestions: questions.count ?? 0,
    totalSessions: sessions.count ?? 0,
    pendingFlags: flagged.count ?? 0,
    totalAiCalls,
    avgScore,
    tierBreakdown,
    recentUsers,
  };
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchStats });

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" />
      </div>
    </AdminLayout>
  );

  const statCards = [
    { label: 'Total Users',       value: stats?.totalUsers ?? 0,      color: '#3B82F6', icon: '👥' },
    { label: 'Questions',         value: stats?.totalQuestions ?? 0,   color: '#10B981', icon: '❓' },
    { label: 'Quizzes Completed', value: stats?.totalSessions ?? 0,    color: '#F59E0B', icon: '📋' },
    { label: 'Pending Flags',     value: stats?.pendingFlags ?? 0,     color: stats?.pendingFlags ? '#EF4444' : '#94A3B8', icon: '🚩' },
    { label: 'AI Calls Total',    value: stats?.totalAiCalls ?? 0,     color: '#8B5CF6', icon: '✨' },
    { label: 'Avg Quiz Score',    value: `${stats?.avgScore ?? 0}%`,   color: '#06B6D4', icon: '📊' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#0D2137] mb-2">Dashboard</h1>
        <p className="text-gray-400 text-sm mb-8">PrepWise platform overview</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{icon}</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              </div>
              <div className="text-3xl font-black text-[#0D2137]" style={{ fontFamily: 'system-ui' }}>{value}</div>
              <div className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Tier breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide mb-4">Subscription Tiers</h2>
            {Object.entries(stats?.tierBreakdown ?? {}).map(([tier, count]) => {
              const pct = stats?.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
              const colors: Record<string, string> = { FREE: '#94A3B8', STUDENT: '#3B82F6', PREMIUM: '#7C3AED', SCHOOL: '#10B981' };
              return (
                <div key={tier} className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-semibold text-[#0D2137]">{tier}</span>
                    <span className="text-sm font-bold" style={{ color: colors[tier] }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[tier] }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent users */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide mb-4">Recent Signups</h2>
            {(stats?.recentUsers ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[#0D2137]">{u.email}</p>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full">{u.subscription_tier}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
