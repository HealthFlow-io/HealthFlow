'use client';

import { QueryProvider, AuthProvider, ThemeProvider, ToastProvider } from '@/providers';
import { type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider />
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
