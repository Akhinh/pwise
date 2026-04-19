'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';

const TIERS = ['ALL', 'FREE', 'STUDENT', 'PREMIUM', 'SCHOOL'];

async function fetchUsers(tier: string, search: string, page: number) {
  let q = supabase
    .from('users')
    .select('id, email, display_name, subscription_tier, subscription_expires_at, streak_count, last_active_at, created_at, is_admin', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * 30, page * 30 - 1);

  if (tier !== 'ALL') q = q.eq('subscription_tier', tier);
  if (search.trim()) q = q.ilike('email', `%${search.trim()}%`);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

async function updateTier(userId: string, tier: string) {
  const { error } = await supabase.from('users').update({ subscription_tier: tier }).eq('id', userId);
  if (error) throw error;
}

async function fetchUserSessions(userId: string) {
  const { data } = await supabase
    .from('quiz_sessions')
    .select('id, subject, exam_type, mode, total_score, started_at, completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(10);
  return data ?? [];
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [tier, setTier] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', tier, search, page],
    queryFn: () => fetchUsers(tier, search, page),
  });

  const { data: sessions } = useQuery({
    queryKey: ['admin-user-sessions', selected?.id],
    queryFn: () => fetchUserSessions(selected.id),
    enabled: !!selected,
  });

  const changeTierMut = useMutation({
    mutationFn: ({ id, t }: { id: string; t: string }) => updateTier(id, t),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Tier updated'); },
    onError: () => toast.error('Failed to update tier'),
  });

  const totalPages = Math.ceil((data?.count ?? 0) / 30);
  const tierColors: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-600',
    STUDENT: 'bg-blue-50 text-blue-700',
    PREMIUM: 'bg-purple-50 text-purple-700',
    SCHOOL: 'bg-green-50 text-green-700',
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2137]">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.count ?? 0} total users</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email..."
            className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
          <div className="flex gap-2">
            {TIERS.map(t => (
              <button key={t}
                onClick={() => { setTier(t); setPage(1); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tier === t ? 'bg-[#0D2137] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Streak</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Last Active</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Change Tier</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.data ?? []).map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-[#0D2137]">{u.display_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tierColors[u.subscription_tier]}`}>
                          {u.subscription_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">🔥 {u.streak_count}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.subscription_tier}
                          onChange={e => changeTierMut.mutate({ id: u.id, t: e.target.value })}
                          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none bg-white focus:border-blue-400">
                          {['FREE', 'STUDENT', 'PREMIUM', 'SCHOOL'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSelected(u)} className="text-xs text-blue-600 hover:underline font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-[#0D2137]">{selected.display_name}</h2>
                  <p className="text-xs text-gray-400">{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div className="p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Quiz Sessions</h3>
                {(sessions ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">No completed quizzes yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(sessions ?? []).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[#0D2137]">{s.subject}</p>
                          <p className="text-xs text-gray-400">{s.exam_type} · {s.mode} · {new Date(s.started_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-sm font-black ${(s.total_score ?? 0) >= 70 ? 'text-green-600' : (s.total_score ?? 0) >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {s.total_score ?? '-'}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
