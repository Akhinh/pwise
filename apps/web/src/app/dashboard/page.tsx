'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { progress, questions } from '@prepwise/api-client';
import { useAuthStore } from '@/store/auth.store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TierBadge } from '@/components/ui';

const SUBJECT_ICONS: Record<string, string> = {
  'Mathematics': '📐', 'English Language': '📖', 'Biology': '🔬',
  'Chemistry': '⚗️', 'Physics': '⚡', 'Economics': '💰',
  'Government': '🏛️', 'Geography': '🌍', 'Literature in English': '📚',
  'Agricultural Science': '🌱', 'Commerce': '🤝',
  'Christian Religious Studies': '✝️', 'Islamic Religious Studies': '☪️',
  'Financial Accounting': '📊', 'Further Mathematics': '🔢', // New subjects
  'History': '🏺','Fine Arts': '🎨','Music': '🎵','French': '🇫🇷','Animal Husbandry': '🐄',
  'Insurance': '🛡️','Civic Education': '🗳️','Yoruba': '🌍','Igbo': '🌍','Arabic': '🌙',
  'Home Economics': '🏠','Hausa': '🌍','Book Keeping': '📒','Data Processing': '💻',
  'Catering Craft Practice': '👨‍🍳','Computer Studies': '🖥️','Marketing': '📣',
  'Physical Education': '⚽',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: summaryRes } = useQuery({
    queryKey: ['progress', 'summary'],
    queryFn: () => progress.summary(),
  });

  const { data: subjectsRes } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => questions.getSubjects(),
  });

  const summary = summaryRes?.success ? summaryRes.data : null;
  const subjects = subjectsRes?.success ? subjectsRes.data : [];

  const stats = [
    { label: 'Day Streak',     value: summary?.streakCount ?? 0,               suffix: '🔥' },
    { label: 'Questions Done', value: summary?.totalQuestionsAnswered ?? 0,     suffix: '' },
    { label: 'Average Score',  value: `${summary?.averageScore ?? 0}%`,         suffix: '' },
    { label: 'Subjects',       value: summary?.subjectCount ?? 0,               suffix: '' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Good day, {user?.displayName?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">Ready to practise today?</p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={user?.subscriptionTier ?? 'FREE'} />
        </div>
      </div>

      {/* Streak banner */}
      {(summary?.streakCount ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-up">
          <span className="text-xl">🔥</span>
          <div>
            <p className="text-sm font-bold text-amber-800">
              You&apos;re on a {summary?.streakCount}-day streak!
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Keep it up to earn the Consistent badge</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, suffix }, i) => (
          <div key={label} className={`bg-white border border-gray-200 rounded-[14px] p-5 animate-fade-up stagger-${i + 1}`}>
            <div className="text-2xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              {value}{suffix}
            </div>
            <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Subjects grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide">Pick a Subject</h2>
          <button onClick={() => router.push('/quiz')} className="text-xs text-blue-600 font-semibold hover:underline">
            View all →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {subjects.slice(0, 8).map((subject, i) => (
            <button
              key={subject}
              onClick={() => router.push(`/quiz?subject=${encodeURIComponent(subject)}`)}
              className={`bg-white border border-gray-200 rounded-[14px] p-4 text-left hover:border-amber-300 hover:shadow-md transition-all duration-150 group animate-fade-up stagger-${Math.min(i + 1, 4)}`}
            >
              <div className="text-xl mb-2">{SUBJECT_ICONS[subject] ?? '📝'}</div>
              <div className="text-xs font-bold text-[#0D2137] group-hover:text-[#1A3A5C] transition-colors leading-tight">{subject}</div>
              <div className="text-[10px] text-gray-300 mt-1">WAEC · NECO</div>
            </button>
          ))}
          {user?.subscriptionTier === 'FREE' && (
            <button
              onClick={() => router.push('/pricing')}
              className="bg-amber-50 border border-dashed border-amber-300 rounded-[14px] p-4 text-left hover:bg-amber-100 transition-all"
            >
              <div className="text-xl mb-2">🔓</div>
              <div className="text-xs font-bold text-amber-700">More subjects</div>
              <div className="text-[10px] text-amber-500 mt-1">Upgrade to unlock</div>
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      {summary && summary.badges.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#0D2137] uppercase tracking-wide mb-3">Badges Earned</h2>
          <div className="flex flex-wrap gap-2">
            {summary.badges.map(badge => (
              <div key={badge.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-full">
                <span className="text-sm">🏅</span>
                <span className="text-xs font-semibold text-amber-800">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA for free users */}
      {user?.subscriptionTier === 'FREE' && (
        <div className="mt-8 bg-[#0D2137] rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold text-white">Unlock unlimited practice</p>
            <p className="text-sm text-white/60 mt-1">Get all subjects, offline mode &amp; 50 AI explanations/day for ₦500/month</p>
          </div>
          <button
            onClick={() => router.push('/pricing')}
            className="flex-shrink-0 bg-[#F59E0B] text-[#0D2137] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#FCD34D] transition-colors whitespace-nowrap"
          >
            See Plans →
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
