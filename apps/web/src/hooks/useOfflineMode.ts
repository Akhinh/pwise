'use client';
// hooks/useOfflineMode.ts

import { useState, useEffect } from 'react';
import { getOfflineMetadata } from '@/lib/offlineStorage';

export interface OfflineSubjectMeta {
  key: string;
  subject: string;
  examType: string;
  savedAt: number;
  count: number;
}

export function useOfflineMode() {
  const [isOnline, setIsOnline]           = useState(true);
  const [downloadedSubjects, setDownloadedSubjects] = useState<OfflineSubjectMeta[]>([]);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Load downloaded subjects metadata
  useEffect(() => {
    getOfflineMetadata()
      .then(setDownloadedSubjects)
      .catch(() => setDownloadedSubjects([]));
  }, [isOnline]); // refresh when coming back online

  const hasOfflineData = downloadedSubjects.length > 0;

  const isSubjectAvailableOffline = (subject: string, examType: string) =>
    downloadedSubjects.some(m => m.subject === subject && m.examType === examType);

  return {
    isOnline,
    isOffline: !isOnline,
    hasOfflineData,
    downloadedSubjects,
    isSubjectAvailableOffline,
    refreshMetadata: () => getOfflineMetadata().then(setDownloadedSubjects),
  };
}