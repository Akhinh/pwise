'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { questions } from '@prepwise/api-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/auth.store';
import { OfflineDownloadButton } from '@/components/OfflineDownload';

const SUBJECT_ICONS: Record<string, string> = {
  'Mathematics': '📐', 'English Language': '📖', 'Biology': '🔬',
  'Chemistry': '⚗️', 'Physics': '⚡', 'Economics': '💰',
  'Government': '🏛️', 'Geography': '🌍', 'Literature in English': '📚',
  'Agricultural Science': '🌱', 'Commerce': '🤝',
  'Christian Religious Studies': '✝️', 'Financial Accounting': '📊',
  'Further Mathematics': '🔢', 'Islamic Religious Studies': '☪️',
  'History': '🏺', 'Fine Arts': '🎨', 'Music': '🎵', 'French': '🇫🇷', 'Animal Husbandry': '🐄',
  'Insurance': '🛡️', 'Civic Education': '🗳️', 'Yoruba': '🌍', 'Igbo': '🌍', 'Arabic': '🌙',
  'Home Economics': '🏠', 'Hausa': '🌍', 'Book Keeping': '📒', 'Data Processing': '💻',
  'Catering Craft Practice': '👨‍🍳', 'Computer Studies': '🖥️', 'Marketing': '📣',
  'Physical Education': '⚽',
};

const MODES = [
  { id: 'PRACTICE',    label: 'Practice Mode', desc: 'Untimed — see answer after each question', icon: '📘', tier: 'FREE' },
  { id: 'TIMED',       label: 'Timed Quiz',     desc: 'Timer on — test your speed',               icon: '⏱️', tier: 'FREE' },
  { id: 'MOCK',        label: 'Mock Exam',       desc: 'Full 3-hour exam simulation',              icon: '📋', tier: 'PREMIUM' },
  { id: 'TOPIC_DRILL', label: 'Topic Drill',     desc: '10 questions on one topic',                icon: '🎯', tier: 'FREE' },
  { id: 'WEAK_AREAS',  label: 'Weak Areas',      desc: 'Auto-generated from your wrong answers',   icon: '⚡', tier: 'STUDENT' },
];

function QuizSetupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuthStore();

  const [subject, setSubject]   = useState(params.get('subject') ?? '');
  const [examType, setExamType] = useState<'WAEC' | 'NECO'>('WAEC');
  const [mode, setMode]         = useState('TIMED');
  const [year, setYear]         = useState('');
  const [count, setCount]       = useState(20);

  const { data: subjectsRes } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => questions.getSubjects(),
  });

  const { data: yearsRes } = useQuery({
    queryKey: ['years', subject, examType],
    queryFn: () => questions.getYears(subject, examType),
    enabled: !!subject,
  });

  const subjectList = subjectsRes?.success ? subjectsRes.data : [];
  const yearList    = yearsRes?.success    ? yearsRes.data    : [];

  const tierRank: Record<string, number> = { FREE: 0, STUDENT: 1, PREMIUM: 2, SCHOOL: 3 };
  const userTier = user?.subscriptionTier ?? 'FREE';
  const isFreeTier = userTier === 'FREE';

  function canUseMode(modeTier: string) {
    return tierRank[userTier] >= tierRank[modeTier];
  }

  function handleStart() {
    if (!subject) return;
    const p = new URLSearchParams({
      subject, examType, mode, count: String(count),
      ...(year ? { year } : {}),
    });
    router.push(`/quiz/active?${p}`);
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-black text-[#0D2137] mb-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          Start a Quiz
        </h1>
        <p className="text-sm text-gray-400 mb-8">Configure your practice session</p>

        {/* Step 1 — Subject */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide">1. Choose Subject</h2>
            {/* Only show offline hint for paid users */}
            {!isFreeTier && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <span>📥</span> Tap to save offline
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {(subjectList as string[]).map((s: string) => (
              <div key={s} className="flex flex-col gap-1">
                {/* Subject select button */}
                <button
                  onClick={() => { setSubject(s); setYear(''); }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-xs font-semibold w-full ${
                    subject === s
                      ? 'border-[#0D2137] bg-[#0D2137] text-white'
                      : 'border-gray-200 text-[#0D2137] hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  <span className="text-sm flex-shrink-0">{SUBJECT_ICONS[s] ?? '📝'}</span>
                  <span className="leading-tight">{s}</span>
                </button>

                {/* Offline download button — only for Student+ */}
                <div className="px-1">
                  <OfflineDownloadButton
                    subject={s}
                    examType={examType}
                    userTier={userTier}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2 — Exam type + year + count */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-4">
          <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">2. Configure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Exam type</label>
              <div className="flex gap-2">
                {(['WAEC', 'NECO'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setExamType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      examType === t
                        ? 'bg-[#0D2137] text-white border-[#0D2137]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Year (optional)</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-[#0D2137] outline-none focus:border-blue-400"
                disabled={!subject}
              >
                <option value="">All years</option>
                {(yearList as number[]).map((y: number) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Questions: {count}</label>
              <input
                type="range" min={5} max={50} step={5} value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="w-full accent-[#0D2137]"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                <span>5</span><span>50</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 — Mode */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-6">
          <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">3. Choose Mode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MODES.map(m => {
              const locked = !canUseMode(m.tier);
              return (
                <button
                  key={m.id}
                  onClick={() => !locked && setMode(m.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    mode === m.id && !locked
                      ? 'border-[#0D2137] bg-[#0D2137] text-white'
                      : locked
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 text-[#0D2137] hover:border-amber-300'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{m.label}</span>
                      {locked && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                          {m.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 opacity-70">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!subject}
          className="w-full bg-[#F59E0B] text-[#0D2137] py-4 rounded-xl font-black text-base hover:bg-[#FCD34D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {subject ? `Start ${count} Questions →` : 'Select a subject to continue'}
        </button>
      </div>
    </DashboardLayout>
  );
}

import { Suspense } from 'react';
export default function QuizSetupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" /></div>}>
      <QuizSetupPage />
    </Suspense>
  );
}
