// Run before hydration. Keep the installed manifest URL stable so Chromium can
// update it. This non-sensitive preference cookie is independent of app theme.
export const pwaThemeScript = `(() => {
  const scheme = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = () => {
    const theme = scheme.matches ? 'dark' : 'light';
    const previous = document.cookie.split('; ').find(value => value.startsWith('kwonnet-pwa-theme='));
    const value = 'kwonnet-pwa-theme=' + theme;
    document.cookie = value + '; Path=/; Max-Age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    if (previous !== value) {
      const link = document.querySelector('link[rel="manifest"]');
      if (link) link.replaceWith(link.cloneNode(true));
    }
  };
  sync();
  scheme.addEventListener('change', sync);
})();`;
