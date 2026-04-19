import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function useOfflineMode() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineEnabled, setIsOfflineEnabled] = useState(false);

  const tier = user?.subscriptionTier ?? 'FREE';
  const canUseOffline = ['STUDENT', 'PREMIUM', 'SCHOOL'].includes(tier);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Only register service worker for paid tiers
    if (canUseOffline && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        setIsOfflineEnabled(true);
      });
    }
  }, [canUseOffline]);

  return { isOnline, isOfflineEnabled, canUseOffline };
}