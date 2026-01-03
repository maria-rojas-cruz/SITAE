// components/error-notification.tsx
"use client";

import { useEffect, useState } from 'react';

let showErrorFn: ((message: string) => void) | null = null;

export function useErrorNotification() {
  return showErrorFn;
}

export function ErrorNotification() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    showErrorFn = (message: string) => {
      setError(message);
      setTimeout(() => setError(null), 5000); // auto hide after 5 seconds
    };

    return () => {
      showErrorFn = null;
    };
  }, []);

  if (!error) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        maxWidth: '400px',
      }}
      onClick={() => setError(null)}
    >
      <strong>Error:</strong> {error}
    </div>
  );
}