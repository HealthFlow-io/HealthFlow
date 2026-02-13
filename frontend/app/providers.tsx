'use client';

import { QueryProvider, AuthProvider, ThemeProvider, ToastProvider, RealtimeProvider } from '@/providers';
import { type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
            <ToastProvider />
            {children}
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
