'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { configureApiClient } from '@prepwise/api-client';
import { useAuthStore } from '@/store/auth.store';

function AuthInitializer() {
  const { accessToken } = useAuthStore();
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    configureApiClient(apiUrl, accessToken ?? undefined);
  }, [accessToken]);
  return null;
}

export function Providers({ children }: { children: React.JSX.Element | React.JSX.Element[] | React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
