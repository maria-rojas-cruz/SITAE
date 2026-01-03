// lib/auth.tsx
"use client";

import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { useEffect } from 'react';
import { fetcher, setErrorHandler } from './api-client';
import { toast, Toaster } from 'sonner';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setErrorHandler((message: string) => {
      toast.error(message);
    });
  }, []);

  return (
    <SessionProvider>
      <SWRConfig value={{ 
        fetcher, 
        shouldRetryOnError: false, 
        revalidateOnFocus: false 
      }}>
        <Toaster position="top-right" />
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    token: session?.token,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    login: () => signIn('google', { callbackUrl: '/' }),
    logout: () => signOut({ callbackUrl: '/login' }),
    session,
  };
}