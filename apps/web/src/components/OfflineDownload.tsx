'use client';
// components/OfflineDownload.tsx
// Add this to the Quiz Setup page or Dashboard so users can download subjects

import { useState, useEffect } from 'react';
import { questions as questionsApi } from '@prepwise/api-client';
import {
  saveQuestionsOffline,
  deleteOfflineSubject,
  isSubjectDownloaded,
} from '@/lib/offlineStorage';
import { useOfflineMode } from '@/hooks/useOfflineMode';

interface Props {
  subject: string;
  examType: 'WAEC' | 'NECO';
  userTier: string; // FREE users cannot use offline mode
}

export function OfflineDownloadButton({ subject, examType, userTier }: Props) {
  const { isOffline, refreshMetadata } = useOfflineMode();
  const [downloaded, setDownloaded]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [progress, setProgress]       = useState('');
  const [checking, setChecking]       = useState(true);

  // FREE tier — show upgrade prompt instead of download button
  if (userTier === 'FREE') {
    return (
      <span className="text-xs text-gray-300 flex items-center gap-1" title="Upgrade to Student plan for offline access">
        🔒 Offline — Student+
      </span>
    );
  }

  useEffect(() => {
    isSubjectDownloaded(subject, examType)
      .then(setDownloaded)
      .finally(() => setChecking(false));
  }, [subject, examType]);

  async function handleDownload() {
    if (isOffline) return;
    setLoading(true);
    setProgress('Fetching questions...');

    try {
      // Fetch all questions for this subject (up to 500)
      const res = await questionsApi.list({
        subject,
        examType,
        limit: 500,
        page: 1,
      });

      if (!res.success || !res.data?.items?.length) {
        setProgress('No questions found');
        return;
      }

      setProgress(`Saving ${res.data.items.length} questions...`);
      await saveQuestionsOffline(subject, examType, res.data.items);

      setDownloaded(true);
      setProgress('');
      await refreshMetadata();
    } catch {
      setProgress('Download failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteOfflineSubject(subject, examType);
      setDownloaded(false);
      await refreshMetadata();
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  if (downloaded) {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-red-500 transition-colors disabled:opacity-50"
        title="Remove offline data for this subject"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.854 5.146a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.793l3.646-3.647a.5.5 0 0 1 .708 0z" clipRule="evenodd"/>
        </svg>
        {loading ? 'Removing...' : 'Saved offline'}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading || isOffline}
      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-40"
      title={isOffline ? 'Go online to download' : `Download ${subject} for offline use`}
    >
      {loading ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {progress || 'Downloading...'}
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M8 1v9m0 0-3-3m3 3 3-3M1 12v1.5A1.5 1.5 0 0 0 2.5 15h11A1.5 1.5 0 0 0 15 13.5V12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Save offline
        </>
      )}
    </button>
  );
}


// ── Full offline manager panel (for Settings/Profile page) ────
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
        <p>No subjects saved for offline use yet.</p>
        <p className="text-xs mt-1">Go to Quiz Setup and tap "Save offline" next to a subject.</p>
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
      {downloadedSubjects.map(meta => (
        <div key={meta.key} className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#0D2137]">{meta.subject}</p>
            <p className="text-xs text-gray-400">
              {meta.examType} · {meta.count} questions · saved {new Date(meta.savedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => handleDelete(meta.subject, meta.examType, meta.key)}
            disabled={deleting === meta.key}
            className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors disabled:opacity-50"
          >
            {deleting === meta.key ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ))}
    </div>
  );
}
