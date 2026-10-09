'use client';
import {useEffect, useState, type ReactNode} from 'react';
import {Box} from '@mui/material';
import {reconnectingFetch} from '@/utils/offline';
import {publicEnv} from '@/config/public-env';

/** Keep the existing React tree, drafts and in-memory caches during outages. */
export default function ConnectivityProvider({children}: {children: ReactNode}) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const original = window.fetch;
    const api = publicEnv('NEXT_PUBLIC_API_URL');
    const apiOrigin = api ? new URL(api, window.location.href).origin : undefined;
    const resilient = reconnectingFetch(original.bind(window), window, navigator, apiOrigin);
    window.fetch = resilient;
    const update = () => setOffline(navigator.onLine === false);
    // A client navigation needs the server's RSC response. While disconnected,
    // leave the current page mounted rather than navigating to an error screen.
    const navigate = (event: MouseEvent) => {
      if (navigator.onLine !== false || !(event.target instanceof Element)) return;
      const link = event.target.closest('a[href]');
      if (!link || link.hasAttribute('download') || link.getAttribute('target') === '_blank') return;
      const url = new URL(link.getAttribute('href')!, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    update();
    window.addEventListener('offline', update);
    window.addEventListener('online', update);
    document.addEventListener('click', navigate, true);
    return () => {
      if (window.fetch === resilient) window.fetch = original;
      window.removeEventListener('offline', update);
      window.removeEventListener('online', update);
      document.removeEventListener('click', navigate, true);
    };
  }, []);
  return <>{children}{offline && <Box role="status" aria-live="polite" sx={{position: 'fixed', bottom: 'calc(16px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', zIndex: theme => theme.zIndex.snackbar, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 3, borderRadius: 2, px: 2, py: 1, maxWidth: '90vw', pointerEvents: 'none'}}>You’re offline. Your page will stay open while we reconnect.</Box>}</>;
}
