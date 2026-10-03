'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);

          // Handle updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New version available!
                    console.log('[PWA] New content is available; please refresh.');
                    // Auto-update by skipping waiting
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    // Optionally reload the page
                    window.location.reload();
                  } else {
                    // Content is cached for offline use.
                    console.log('[PWA] Content is cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed, reloading...');
        window.location.reload();
      });
    }
  }, []);

  return null;
}
