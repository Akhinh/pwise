'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyInsights } from '@prepwise/api-client';
import { Sparkles, TrendingUp, TrendingDown, RefreshCw, Lock } from 'lucide-react';

interface StudyInsightsCardProps {
  userTier: 'FREE' | 'STUDENT' | 'PREMIUM' | 'SCHOOL';
}

const QUERY_KEY = ['study-insights', 'latest'];

export default function StudyInsightsCard({ userTier }: StudyInsightsCardProps) {
  const queryClient = useQueryClient();
  const isLocked = userTier !== 'PREMIUM' && userTier !== 'SCHOOL';

  const { data: latestRes, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => studyInsights.getLatest(),
    enabled: !isLocked,
  });

  const generateMutation = useMutation({
    mutationFn: () => studyInsights.generate(),
    onSuccess: (res) => {
      if (res.success) queryClient.setQueryData(QUERY_KEY, res);
    },
  });

  // request() never throws — failures come back as { success: false, error } —
  // so errors from either call surface through .data, not onError/catch.
  const insight = generateMutation.data?.success
    ? generateMutation.data.data
    : latestRes?.success
    ? latestRes.data
    : null;

  const error =
    (generateMutation.data && !generateMutation.data.success ? (generateMutation.data as any).error : null) ??
    (latestRes && !latestRes.success ? (latestRes as any).error : null);

  if (isLocked) {
    return (
      <div className="bg-amber-50 border border-dashed border-amber-300 rounded-[14px] p-6">
        <div className="flex items-center gap-2 text-amber-700">
          <Lock size={16} />
          <h3 className="text-sm font-bold">AI Study Insights</h3>
        </div>
        <p className="text-xs text-amber-600 mt-1.5">
          Get a personalized study plan generated from your quiz history.
        </p>
        <a href="/pricing" className="mt-3 inline-block text-xs font-semibold text-amber-700 hover:underline">
          Upgrade to unlock →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[14px] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-[#0D2137]">AI Study Insights</h3>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <RefreshCw size={12} className={generateMutation.isPending ? 'animate-spin' : ''} />
          {insight ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {isLoading && <p className="mt-4 text-sm text-gray-400">Loading your insights...</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isLoading && !insight && !generateMutation.isPending && !error && (
        <p className="mt-4 text-sm text-gray-400">
          No insights yet. Complete a few quizzes, then generate your first personalized study plan.
        </p>
      )}

      {generateMutation.isPending && <p className="mt-4 text-sm text-gray-400">Analyzing your quiz history...</p>}

      {insight && !generateMutation.isPending && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">{insight.summary}</p>

          {insight.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-emerald-600">
                <TrendingUp size={13} /> Strengths
              </div>
              <ul className="mt-1.5 space-y-1">
                {insight.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    <span className="font-semibold text-[#0D2137]">{s.subject}</span> — {s.note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.weaknesses.length > 0 && (
            <div>
              {/* red, not amber — amber is your upgrade/CTA accent everywhere else on this page */}
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-red-500">
                <TrendingDown size={13} /> Focus areas
              </div>
              <ul className="mt-1.5 space-y-1">
                {insight.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    <span className="font-semibold text-[#0D2137]">
                      {w.subject}
                      {w.topic ? ` — ${w.topic}` : ''}
                    </span>{' '}
                    — {w.note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.studyPlan.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-400">7-Day Plan</div>
              <div className="mt-2 space-y-2">
                {insight.studyPlan.map((day, i) => (
                  <div key={i} className="rounded-[10px] bg-gray-50 p-3">
                    <div className="text-sm font-semibold text-[#0D2137]">
                      {day.day} — {day.focus}
                    </div>
                    <ul className="mt-1 list-inside list-disc text-xs text-gray-500">
                      {day.tasks.map((t, j) => (
                        <li key={j}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-300">
            Generated {new Date(insight.generatedAt).toLocaleDateString()} from {insight.quizSessionsUsed} quiz
            sessions · Powered by Gemini
          </p>
        </div>
      )}
    </div>
  );
}