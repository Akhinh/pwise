'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken() {
  try {
    const s = localStorage.getItem('prepwise-auth');
    return s ? JSON.parse(s)?.state?.accessToken ?? null : null;
  } catch { return null; }
}

function MockResultsPage() {
  const router    = useRouter();
  const params    = useSearchParams();
  const sessionId = params.get('sessionId') ?? '';

  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_URL}/api/v1/theory-quiz/${sessionId}/answers`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20"><Spinner size={36}/></div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Results not found.</p>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-blue-600 hover:underline">Back to Dashboard</button>
      </div>
    </DashboardLayout>
  );

  const { session, questions } = data;

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Mock Exam Complete! 🎓
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-[#0D2137]">← Dashboard</button>
        </div>

        {/* Summary card */}
        <div className="bg-[#0D2137] rounded-[20px] p-6 mb-5 text-white">
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Mock Exam</p>
          <p className="text-xl font-black" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            {session.subject} · {session.examType}
          </p>
          <p className="text-white/60 text-sm mt-1">{questions.length} theory questions</p>
          <div className="mt-4 bg-[#F59E0B] text-[#0D2137] rounded-xl px-4 py-3 inline-block">
            <p className="text-xs font-bold uppercase tracking-wide">Review your answers below</p>
            <p className="text-[11px] mt-0.5 opacity-70">Model answers are now visible for every question</p>
          </div>
        </div>

        {/* Question review list */}
        <div className="space-y-4 mb-6">
          {questions.map((q: any, i: number) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">{q.year}</span>
                <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded">Q{q.questionNumber}</span>
                {q.topic && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">{q.topic}</span>}
              </div>

              <p className="text-sm font-semibold text-[#0D2137] leading-relaxed mb-3">{q.questionText}</p>

              {q.subQuestions?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {q.subQuestions.map((sq: any, j: number) => (
                    <div key={j} className="flex gap-3">
                      <span className="text-xs font-black text-[#F59E0B] flex-shrink-0 min-w-[2rem]">({sq.label})</span>
                      <p className="text-xs text-gray-600 leading-relaxed">{sq.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {q.answer ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2">📋 Model Answer</p>
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{q.answer}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic mt-3">Model answer not available for this question.</p>
              )}
            </div>
          ))}
        </div>

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
export default function MockResultsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin"/></div>}>
      <MockResultsPage/>
    </Suspense>
  );
}
