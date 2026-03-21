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
    let hasReloadedForController = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const requestSkipWaiting = (worker) => {
      worker?.postMessage({ type: 'SKIP_WAITING' });
    };

    const handleControllerChange = () => {
      if (!hadController || hasReloadedForController) {
        return;
      }

      hasReloadedForController = true;
      window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        if (cancelled) {
          return;
        }

        await registration.update();

        if (registration.waiting) {
          requestSkipWaiting(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;

          if (!worker) {
            return;
          }

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              requestSkipWaiting(registration.waiting || worker);
            }
          });
        });
      } catch {
        // Keep installability progressive. If registration fails, the site should still work.
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    register();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return null;
}
