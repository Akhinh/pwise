'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { quiz } from '@prepwise/api-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScoreRing, Spinner } from '@/components/ui';

function QuizResultsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('sessionId') ?? '';

  const { data: reportRes, isLoading } = useQuery({
    queryKey: ['quiz-report', sessionId],
    queryFn: () => quiz.getReport(sessionId),
    enabled: !!sessionId,
  });

  const report = reportRes?.success ? reportRes.data : null;

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20"><Spinner size={36} /></div>
    </DashboardLayout>
  );

  if (!report) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <p className="text-gray-400">Results not found.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 text-sm text-blue-600 hover:underline">Back to Dashboard</button>
      </div>
    </DashboardLayout>
  );

  const mins = Math.floor(report.timeTakenSeconds / 60);
  const secs = report.timeTakenSeconds % 60;

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Quiz Complete! 🎉</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-[#0D2137] transition-colors">← Dashboard</button>
        </div>

        {/* Score hero */}
        <div className="bg-white border border-gray-200 rounded-[20px] p-8 text-center mb-5">
          <ScoreRing score={report.totalScore} size={120} />
          <p className="font-display text-lg font-bold text-[#0D2137] mt-4">{report.session.subject} · {report.session.examType}</p>
          <p className="text-sm text-gray-400 mt-1">Completed in {mins}m {secs}s · {report.totalQuestions} questions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Correct',  value: report.correctCount,  color: '#10B981' },
            { label: 'Wrong',    value: report.wrongCount,    color: '#EF4444' },
            { label: 'Skipped',  value: report.skippedCount,  color: '#64748B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-[14px] p-4 text-center">
              <div className="text-2xl font-black" style={{ color, fontFamily: "'Fraunces', Georgia, serif" }}>{value}</div>
              <div className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Answer list */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-5">
          <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">Answer Breakdown</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {report.answers.map((ans, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ans.isCorrect ? 'bg-green-400' : 'bg-red-400'}`} />
                <p className="text-xs text-gray-600 flex-1 truncate">{ans.question?.questionText?.substring(0, 60)}...</p>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                  ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {ans.isCorrect ? 'Correct' : `Wrong · ${ans.selectedOption ?? 'Skipped'}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => router.push('/quiz')} className="flex-1 bg-[#0D2137] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#1A3A5C] transition-colors">
            New Quiz
          </button>
          <button onClick={() => router.push('/progress')} className="flex-1 bg-white border border-gray-200 text-[#0D2137] py-3.5 rounded-xl font-bold text-sm hover:border-blue-300 transition-colors">
            View Progress
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { Suspense } from 'react';
export default function QuizResultsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" /></div>}>
      <QuizResultsPage />
    </Suspense>
  );
}
