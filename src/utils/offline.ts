/** Retry safe browser reads only. Never replay a purchase, answer or other mutation. */
export function reconnectingFetch(original: typeof fetch, browser: Window, connection: Pick<Navigator, 'onLine'>, apiOrigin?: string): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : undefined;
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const url = new URL(request?.url ?? String(input), browser.location.href);
    if (method !== 'GET' || (url.origin !== browser.location.origin && url.origin !== apiOrigin)) return original(input, init);
    const signal = init?.signal ?? request?.signal;
    let delay = 1000;
    for (;;) {
      signal?.throwIfAborted();
      if (connection.onLine !== false) {
        try { return await original(input, init); }
        catch (error) {
          // HTTP errors are returned unchanged. Programming errors and explicit
          // cancellation must still surface; fetch network failures are TypeError.
          if (signal?.aborted || !(error instanceof TypeError)) throw error;
        }
      }
      await waitForReconnect(browser, signal, delay);
      delay = Math.min(delay * 2, 30_000);
    }
  };
}

/** Wake on the browser online event or a backed-off connectivity probe. */
export function waitForReconnect(browser: Window, signal?: AbortSignal | null, delay = 1000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      browser.clearTimeout(timer);
      browser.removeEventListener('online', resume);
      signal?.removeEventListener('abort', abort);
    };
    const resume = () => { cleanup(); resolve(); };
    const abort = () => { cleanup(); reject(signal?.reason); };
    const timer = browser.setTimeout(resume, delay);
    browser.addEventListener('online', resume, {once: true});
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) abort();
  });
}
