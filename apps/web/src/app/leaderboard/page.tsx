'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboard, questions } from '@prepwise/api-client';
import { useAuthStore } from '@/store/auth.store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner, EmptyState } from '@/components/ui';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: subjectsRes } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => questions.getSubjects(),
  });

  const { data: lbRes, isLoading } = useQuery({
    queryKey: ['leaderboard', subject],
    queryFn: () => leaderboard.get(subject || undefined),
  });

  const subjects = subjectsRes?.success ? subjectsRes.data : [];
  const entries  = lbRes?.success ? lbRes.data : [];
  const medals   = ['🥇', '🥈', '🥉'];

  // Filter subjects by search input
  const filteredSubjects = subjects.filter((s: string) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectSubject(s: string) {
    setSubject(s);
    setSearch('');
    setOpen(false);
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#0D2137]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Leaderboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">How you rank against students across Nigeria</p>
          </div>
        </div>

        {/* Subject filter */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-4 mb-5">
          <p className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-3">Filter by Subject</p>

          <div className="flex items-center gap-3 flex-wrap">
            {/* All subjects button */}
            <button
              onClick={() => selectSubject('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex-shrink-0 ${
                subject === ''
                  ? 'bg-[#0D2137] text-white border-[#0D2137]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              🌍 All Subjects
            </button>

            {/* Selected subject badge */}
            {subject && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold text-amber-700">{subject}</span>
                <button
                  onClick={() => selectSubject('')}
                  className="text-amber-500 hover:text-amber-700 text-xs font-black"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Searchable dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-500 hover:border-gray-300 transition-all"
              >
                <span>📚 Browse Subjects</span>
                <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {open && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-[14px] shadow-lg z-50 overflow-hidden">
                  {/* Search input */}
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search subjects..."
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-[#1E293B] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
                    />
                  </div>

                  {/* Subject list */}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredSubjects.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No subjects found</p>
                    ) : (
                      filteredSubjects.map((s: string) => (
                        <button
                          key={s}
                          onClick={() => selectSubject(s)}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-amber-50 hover:text-amber-700 ${
                            subject === s
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-[#0D2137]'
                          }`}
                        >
                          {subject === s && <span className="mr-2">✓</span>}
                          {s}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Showing filter summary */}
          <p className="text-[11px] text-gray-400 mt-3">
            {subject
              ? `Showing rankings for ${subject}`
              : `Showing overall rankings across all ${subjects.length} subjects`
            }
          </p>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : entries.length === 0 ? (
            <EmptyState
              icon="🏆"
              title="No rankings yet"
              description={subject
                ? `No one has completed a timed ${subject} quiz yet`
                : 'Complete timed quizzes to appear on the leaderboard'
              }
              action={{ label: 'Start a Quiz', href: '/quiz' }}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide w-16">#</th>
                  <th className="text-left py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide">Student</th>
                  <th className="text-right py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide">Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isMe = entry.user.id === user?.id;
                  const initials = entry.user.displayName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={entry.user.id}
                      className={`border-b border-gray-50 transition-colors ${isMe ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-3.5 px-5">
                        <span className="text-sm font-black">
                          {i < 3
                            ? medals[i]
                            : <span className="text-gray-400">{entry.rank}</span>
                          }
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0D2137] flex items-center justify-center text-[10px] font-black text-[#F59E0B] flex-shrink-0">
                            {initials}
                          </div>
                          <p className={`text-sm font-semibold ${isMe ? 'text-amber-700' : 'text-[#0D2137]'}`}>
                            {entry.user.displayName}
                            {isMe && <span className="ml-1 text-xs font-normal text-amber-500">(you)</span>}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`text-sm font-black ${isMe ? 'text-amber-600' : 'text-[#0D2137]'}`}>
                          {entry.score}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {entries.length > 0 && !entries.find(e => e.user.id === user?.id) && (
          <p className="text-center text-xs text-gray-400 mt-4">
            You&apos;re not in the top 50 yet — complete more timed quizzes to earn your spot.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}