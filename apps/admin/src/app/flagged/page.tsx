'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';

type Status = 'PENDING' | 'REVIEWED' | 'FIXED' | 'DISMISSED';

async function fetchFlagged(status: Status | 'ALL') {
  let q = supabase
    .from('flagged_questions')
    .select(`
      id, reason, status, admin_note, created_at,
      questions(id, subject, year, exam_type, question_text, correct_answer),
      users(email, display_name)
    `)
    .order('created_at', { ascending: false });

  if (status !== 'ALL') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

async function updateFlag(id: string, status: Status, adminNote: string) {
  const { error } = await supabase
    .from('flagged_questions')
    .update({ status, admin_note: adminNote })
    .eq('id', id);
  if (error) throw error;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  REVIEWED: 'bg-blue-50 text-blue-700 border-blue-200',
  FIXED: 'bg-green-50 text-green-700 border-green-200',
  DISMISSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function FlaggedPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | 'ALL'>('PENDING');
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState<Status>('REVIEWED');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-flagged', filter],
    queryFn: () => fetchFlagged(filter),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: Status; adminNote: string }) =>
      updateFlag(id, status, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flagged'] });
      toast.success('Flag updated');
      setSelected(null);
      setNote('');
    },
    onError: () => toast.error('Failed to update flag'),
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2137]">Flagged Questions</h1>
          <p className="text-gray-400 text-sm mt-0.5">Student-reported question errors</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-5">
          {(['ALL', 'PENDING', 'REVIEWED', 'FIXED', 'DISMISSED'] as const).map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === s ? 'bg-[#0D2137] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0D2137] animate-spin" />
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-gray-400 font-medium">No {filter !== 'ALL' ? filter.toLowerCase() : ''} flags</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(data ?? []).map((f: any) => (
              <div key={f.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[f.status]}`}>
                        {f.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {f.questions?.subject} · {f.questions?.year} · {f.questions?.exam_type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#0D2137] mb-1 line-clamp-2">{f.questions?.question_text}</p>
                    <p className="text-xs text-red-500 font-medium mb-1">Report: "{f.reason}"</p>
                    <p className="text-xs text-gray-400">Reported by {f.users?.email} · {new Date(f.created_at).toLocaleDateString()}</p>
                    {f.admin_note && (
                      <p className="text-xs text-blue-600 mt-1.5 bg-blue-50 px-3 py-2 rounded-lg">Note: {f.admin_note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelected(f); setNote(f.admin_note ?? ''); setNewStatus(f.status as Status); }}
                    className="flex-shrink-0 px-4 py-2 bg-[#0D2137] text-white text-sm font-semibold rounded-xl hover:bg-[#1A3A5C] transition-colors">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <h2 className="font-bold text-[#0D2137]">Review Flag</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Question</p>
                  <p className="text-sm text-[#0D2137]">{selected.questions?.question_text}</p>
                  <p className="text-xs text-gray-400 mt-2">Correct answer: <strong>{selected.questions?.correct_answer}</strong></p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 mb-1">Student's Report</p>
                  <p className="text-sm text-red-700">"{selected.reason}"</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Resolution</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as Status)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white">
                    <option value="REVIEWED">REVIEWED — Looked into, no change needed</option>
                    <option value="FIXED">FIXED — Question has been corrected</option>
                    <option value="DISMISSED">DISMISSED — Invalid report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Admin Note (optional)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder="Add internal notes about this flag..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)}
                    className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={() => resolveMut.mutate({ id: selected.id, status: newStatus, adminNote: note })}
                    disabled={resolveMut.isPending}
                    className="flex-1 py-2.5 bg-[#0D2137] text-white text-sm font-bold rounded-xl hover:bg-[#1A3A5C] disabled:opacity-50">
                    {resolveMut.isPending ? 'Saving...' : 'Save Resolution'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
