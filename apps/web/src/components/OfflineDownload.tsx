'use client';
// components/OfflineDownload.tsx

import { useState } from 'react';
import { deleteOfflineSubject } from '@/lib/offlineStorage';
import { useOfflineMode } from '@/hooks/useOfflineMode';

// ── Offline manager panel (Profile page) ──────────────────────
export function OfflineManager() {
  const { isOffline, downloadedSubjects, refreshMetadata } = useOfflineMode();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(subject: string, examType: string, key: string) {
    setDeleting(key);
    try {
      await deleteOfflineSubject(subject, examType);
      await refreshMetadata();
    } finally {
      setDeleting(null);
    }
  }

  if (downloadedSubjects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <p className="text-2xl mb-2">📥</p>
        <p className="font-medium">No subjects saved yet.</p>
        <p className="text-xs mt-1 text-gray-300">
          Questions save automatically as you practise online. After a few sessions,
          your subjects will appear here and be available offline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
          📡 You&apos;re offline — using saved questions
        </div>
      )}
      <p className="text-xs text-gray-400 pb-1">
        Questions grow automatically with each online practice session.
      </p>
      {downloadedSubjects.map(meta => (
        <div key={meta.key} className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#0D2137]">{meta.subject}</p>
            <p className="text-xs text-gray-400">
              {meta.examType} · {meta.count} questions · updated {new Date(meta.savedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <button
            onClick={() => handleDelete(meta.subject, meta.examType, meta.key)}
            disabled={deleting === meta.key}
            className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {deleting === meta.key ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ))}
    </div>
  );
}
