'use client';

import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useAuthStore } from '@/store/auth.store';

export function OfflineBanner() {
  const { isOnline, hasOfflineData } = useOfflineMode();
  const { user } = useAuthStore();

  const tier         = user?.subscriptionTier ?? 'FREE';
  const canUseOffline = tier !== 'FREE';

  if (isOnline) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 text-center text-sm py-2 font-semibold ${
      canUseOffline
        ? 'bg-yellow-400 text-yellow-900'
        : 'bg-red-500 text-white'
    }`}>
      {canUseOffline
        ? hasOfflineData
          ? '📶 You are offline — using saved questions'
          : '📶 You are offline — practise a subject online first to enable offline access'
        : `📶 You are offline — upgrade to ${tier === 'FREE' ? 'Student or Premium' : 'Premium'} for offline access`
      }
    </div>
  );
}