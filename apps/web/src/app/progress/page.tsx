'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { progress } from '@prepwise/api-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProgressBar, Spinner } from '@/components/ui';

const SUBJECT_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#84CC16'];

export default function ProgressPage() {
  const [days, setDays] = useState<7 | 30>(7);

  const { data: summaryRes } = useQuery({ queryKey: ['progress', 'summary'], queryFn: () => progress.summary() });
  const { data: subjectsRes } = useQuery({ queryKey: ['progress', 'subjects'], queryFn: () => progress.subjects() });
  const { data: activityRes, isLoading: loadingActivity } = useQuery({
    queryKey: ['progress', 'activity', days],
    queryFn: () => progress.activity(days),
  });

  const summary  = summaryRes?.success  ? summaryRes.data  : null;
  const subjects = subjectsRes?.success ? subjectsRes.data : [];
  const activity = activityRes?.success ? activityRes.data : [];

  const maxActivity = Math.max(...activity.map((a: any) => a.questionsAnswered), 1);

  const weakSubjects = subjects.filter((s: any) => s.accuracyPercent < 60);

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>My Progress</h1>
            <p className="text-sm text-gray-400 mt-1">Track your improvement over time</p>
          </div>
          <div className="flex gap-2">
            {([7, 30] as const).map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${days === d ? 'bg-[#0D2137] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Questions Done',  value: summary?.totalQuestionsAnswered ?? 0 },
            { label: 'Average Score',   value: `${summary?.averageScore ?? 0}%` },
            { label: 'Day Streak',      value: `${summary?.streakCount ?? 0} 🔥` },
            { label: 'Subjects Active', value: summary?.subjectCount ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-[14px] p-5">
              <div className="text-2xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{value}</div>
              <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-5">
          <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-5">Daily Activity</h2>
          {loadingActivity ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {activity.map((day: any, i: number) => {
                const pct = maxActivity > 0 ? (day.questionsAnswered / maxActivity) * 100 : 0;
                const isToday = i === activity.length - 1;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col justify-end" style={{ height: 100 }}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-[#F59E0B]' : 'bg-blue-200'}`}
                        style={{ height: `${Math.max(pct, pct > 0 ? 8 : 2)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-300">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).slice(0,2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject breakdown */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white border border-gray-200 rounded-[14px] p-5">
            <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">Accuracy by Subject</h2>
            {subjects.length === 0 ? (
              <p className="text-sm text-gray-300 py-4">No quiz data yet. Start practising!</p>
            ) : (
              <div className="space-y-4">
                {subjects.map((s: any, i: number) => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#0D2137]">{s.subject}</span>
                      <span className="text-xs font-bold" style={{ color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}>
                        {s.accuracyPercent}%
                      </span>
                    </div>
                    <ProgressBar value={s.accuracyPercent} color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                    <p className="text-[10px] text-gray-300 mt-1">{s.questionsAnswered} questions answered</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="bg-white border border-gray-200 rounded-[14px] p-5">
            <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">Badges ({summary?.badges?.length ?? 0} earned)</h2>
            {!summary?.badges?.length ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🏅</p>
                <p className="text-sm text-gray-400">Complete quizzes to earn badges</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {summary.badges.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <span className="text-lg">🏅</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800">{b.name}</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">{b.description?.substring(0,30)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weak areas alert */}
        {weakSubjects.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-[14px] p-5">
            <p className="text-sm font-bold text-red-700 mb-2">⚠️ Subjects needing attention</p>
            <div className="flex flex-wrap gap-2">
              {weakSubjects.map((s: any) => (
                <span key={s.subject} className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {s.subject} — {s.accuracyPercent}%
                </span>
              ))}
            </div>
            <p className="text-xs text-red-500 mt-3">Practice these subjects more to improve your overall score.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
