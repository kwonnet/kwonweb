'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const Context = createContext<{ canInstall: boolean; ios: boolean; install: () => Promise<void> }>({ canInstall: false, ios: false, install: async () => {} });
export const usePwaInstall = () => useContext(Context);

export default function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent>();
  const [ios, setIos] = useState(false), [installed, setInstalled] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const update = () => setInstalled(standalone.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    update();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const installedApp = () => { setInstalled(true); setPrompt(undefined); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installedApp);
    standalone.addEventListener('change', update);
    // Registration is independent of notification permission and sign-in.
    if (process.env.NODE_ENV === 'production' && window.isSecureContext && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => console.warn('Kwonnet offline support could not be registered.'));
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installedApp);
      standalone.removeEventListener('change', update);
    };
  }, []);
  const install = async () => {
    if (!prompt) return;
    try { await prompt.prompt(); await prompt.userChoice; }
    finally { setPrompt(undefined); }
  };
  return <Context.Provider value={{ canInstall: !installed && (!!prompt || ios), ios, install }}>{children}</Context.Provider>;
}
