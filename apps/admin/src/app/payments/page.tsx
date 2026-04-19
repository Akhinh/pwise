'use client';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';

async function fetchPayments() {
  // Subscription breakdown
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('tier, status, users(email, display_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Recent payment events
  const { data: logs } = await supabase
    .from('payments_log')
    .select('id, event_type, processed, created_at, user_id, users(email)')
    .order('created_at', { ascending: false })
    .limit(30);

  // Summary
  const tierCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  for (const s of subs ?? []) {
    tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }

  return { subs: subs ?? [], logs: logs ?? [], tierCounts, statusCounts };
}

const EVENT_COLORS: Record<string, string> = {
  'charge.success': 'bg-green-50 text-green-700',
  'subscription.create': 'bg-blue-50 text-blue-700',
  'subscription.disable': 'bg-red-50 text-red-700',
  'subscription.not_renew': 'bg-yellow-50 text-yellow-700',
  'invoice.create': 'bg-gray-100 text-gray-600',
};

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-payments'], queryFn: fetchPayments });

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2137]">Payments</h1>
          <p className="text-gray-400 text-sm mt-0.5">Paystack subscription & webhook log</p>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" />
          </div>
        ) : (
          <>
            {/* Subscription summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Active', value: data?.statusCounts['ACTIVE'] ?? 0, color: '#10B981' },
                { label: 'Cancelled', value: data?.statusCounts['CANCELLED'] ?? 0, color: '#F59E0B' },
                { label: 'Expired', value: data?.statusCounts['EXPIRED'] ?? 0, color: '#EF4444' },
                { label: 'Total Subs', value: data?.subs.length ?? 0, color: '#3B82F6' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: color }} />
                  <p className="text-3xl font-black text-[#0D2137]">{value}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Tier breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
              <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide mb-4">Paid Subscribers by Tier</h2>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(data?.tierCounts ?? {}).filter(([t]) => t !== 'FREE').map(([tier, count]) => {
                  const tierColors: Record<string, string> = { STUDENT: '#3B82F6', PREMIUM: '#7C3AED', SCHOOL: '#10B981' };
                  return (
                    <div key={tier} className="text-center">
                      <p className="text-3xl font-black" style={{ color: tierColors[tier] }}>{count}</p>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{tier}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Webhook log */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide">Recent Webhook Events</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(data?.logs ?? []).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${EVENT_COLORS[log.event_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.event_type}
                      </span>
                      <p className="text-xs text-gray-400">{log.users?.email ?? 'Unknown user'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${log.processed ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {(data?.logs ?? []).length === 0 && (
                  <p className="px-6 py-8 text-sm text-gray-400 text-center">No webhook events yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
