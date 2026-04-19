'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';

const SUBJECTS = [
  'All Subjects','Mathematics','English Language','Biology','Chemistry',
  'Physics','Economics','Government','Literature in English','Geography',
  'Agricultural Science','Commerce','Christian Religious Studies','Islamic Religious Studies',
  'Financial Accounting','Further Mathematics','History','Fine Arts',
  'Music','French','Animal Husbandry','Insurance','Civic Education','Yoruba',
  'Igbo','Arabic','Home Economics','Hausa','Book Keeping','Data Processing',
  'Catering Craft Practice','Computer Studies','Marketing','Physical Education'
];

async function fetchQuestions(subject: string, search: string, page: number) {
  let q = supabase
    .from('questions')
    .select('id, subject, year, exam_type, question_text, correct_answer, difficulty, is_active, is_verified, ai_explanation', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * 30, page * 30 - 1);

  if (subject !== 'All Subjects') q = q.eq('subject', subject);
  if (search.trim()) q = q.ilike('question_text', `%${search.trim()}%`);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

async function toggleActive(id: string, current: boolean) {
  const { error } = await supabase.from('questions').update({ is_active: !current }).eq('id', id);
  if (error) throw error;
}

async function toggleVerified(id: string, current: boolean) {
  const { error } = await supabase.from('questions').update({ is_verified: !current }).eq('id', id);
  if (error) throw error;
}

export default function QuestionsPage() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('All Subjects');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-questions', subject, search, page],
    queryFn: () => fetchQuestions(subject, search, page),
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) => toggleActive(id, current),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); toast.success('Updated'); },
    onError: () => toast.error('Failed to update'),
  });

  const toggleVerifiedMut = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) => toggleVerified(id, current),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); toast.success('Updated'); },
    onError: () => toast.error('Failed to update'),
  });

  const totalPages = Math.ceil((data?.count ?? 0) / 30);

  return (
    <AdminLayout>
      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2137]">Questions</h1>
            <p className="text-gray-400 text-sm mt-0.5">{data?.count ?? 0} total questions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search question text..."
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
          <select
            value={subject}
            onChange={e => { setSubject(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
          >
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
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
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-[40%]">Question</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Subject</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Year</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Answer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">AI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Verified</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Active</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.data ?? []).map((q: any) => (
                    <tr key={q.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-[#0D2137] font-medium">
                        <p className="truncate max-w-xs">{q.question_text}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{q.subject}</td>
                      <td className="px-4 py-3 text-gray-500">{q.year}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.exam_type === 'WAEC' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                          {q.exam_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-black bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full">{q.correct_answer}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`w-2 h-2 rounded-full inline-block ${q.ai_explanation ? 'bg-green-400' : 'bg-gray-200'}`} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVerifiedMut.mutate({ id: q.id, current: q.is_verified })}
                          className={`w-10 h-5 rounded-full transition-colors ${q.is_verified ? 'bg-green-400' : 'bg-gray-200'}`}
                        >
                          <span className={`block w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${q.is_verified ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActiveMut.mutate({ id: q.id, current: q.is_active })}
                          className={`w-10 h-5 rounded-full transition-colors ${q.is_active ? 'bg-[#0D2137]' : 'bg-gray-200'}`}
                        >
                          <span className={`block w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${q.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSelected(q)} className="text-xs text-blue-600 hover:underline font-medium">View</button>
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
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <h2 className="font-bold text-[#0D2137]">Question Detail</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Question</p>
                  <p className="text-sm text-[#0D2137]">{selected.question_text}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Subject</p>
                    <p className="text-sm font-semibold">{selected.subject}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Year</p>
                    <p className="text-sm font-semibold">{selected.year}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Correct Answer</p>
                    <p className="text-sm font-bold text-green-600">{selected.correct_answer}</p>
                  </div>
                </div>
                {selected.ai_explanation && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">AI Explanation</p>
                    <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-4">{selected.ai_explanation}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">ID</p>
                  <p className="text-xs font-mono text-gray-400 break-all">{selected.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
