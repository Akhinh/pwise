'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

async function fetchAiUsage() {
  // Daily totals for last 30 days
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString().split('T')[0];
  const { data: daily } = await supabase
    .from('ai_usage_log')
    .select('date, call_count')
    .gte('date', since)
    .order('date', { ascending: true });

  // Top users today
  const today = new Date().toISOString().split('T')[0];
  const { data: topToday } = await supabase
    .from('ai_usage_log')
    .select('user_id, call_count, users(email, display_name, subscription_tier)')
    .eq('date', today)
    .order('call_count', { ascending: false })
    .limit(15);

  // Aggregate by date
  const byDate: Record<string, number> = {};
  for (const row of daily ?? []) {
    byDate[row.date] = (byDate[row.date] || 0) + row.call_count;
  }

  // Fill 30-day chart
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400 * 1000).toISOString().split('T')[0];
    chartData.push({ date: d.slice(5), calls: byDate[d] || 0 });
  }

  const totalMonth = Object.values(byDate).reduce((a, b) => a + b, 0);
  const todayTotal = byDate[today] || 0;

  return { chartData, topToday: topToday ?? [], totalMonth, todayTotal };
}

export default function AiUsagePage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-ai-usage'], queryFn: fetchAiUsage });

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2137]">AI Usage</h1>
          <p className="text-gray-400 text-sm mt-0.5">Claude API call monitoring</p>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Today's Calls</p>
                <p className="text-4xl font-black text-[#0D2137]">{data?.todayTotal ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">30-Day Total</p>
                <p className="text-4xl font-black text-[#0D2137]">{data?.totalMonth ?? 0}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide mb-5">Daily AI Calls — Last 30 Days</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.chartData ?? []} barSize={8}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="calls" fill="#0D2137" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top users today */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide">Top Users Today</h2>
              </div>
              {(data?.topToday ?? []).length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-400 text-center">No AI calls today yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(data?.topToday ?? []).map((row: any, i) => (
                    <div key={row.user_id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-300 w-5">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#0D2137]">{row.users?.display_name}</p>
                          <p className="text-xs text-gray-400">{row.users?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                          {row.users?.subscription_tier}
                        </span>
                        <span className="text-sm font-black text-[#0D2137]">{row.call_count} calls</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
