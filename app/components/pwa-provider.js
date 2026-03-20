'use client';

import { useEffect } from 'react';

function canRegisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  return window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

export function PWAProvider() {
  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return undefined;
    }

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        if (cancelled) {
          return;
        }

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch {
        // Keep installability progressive. If registration fails, the site should still work.
      }
    };

    register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
