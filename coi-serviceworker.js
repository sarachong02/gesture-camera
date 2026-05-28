/* coi-serviceworker v0.1.7 - Guido Zuidhof - MIT License
 * Adds COOP/COEP headers via service worker so SharedArrayBuffer
 * (required by MediaPipe WASM) works on hosts that can't set custom
 * HTTP headers (e.g. GitHub Pages).
 */
if (typeof window === 'undefined') {
  // ── Service worker context ──────────────────────────────────────
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', function (event) {
    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
      return;
    }
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response.status === 0) return response;
          const headers = new Headers(response.headers);
          headers.set('Cross-Origin-Opener-Policy', 'same-origin');
          headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        })
        .catch(function (err) { console.error('coi-serviceworker fetch error', err); })
    );
  });
} else {
  // ── Main thread context ─────────────────────────────────────────
  if (!crossOriginIsolated) {
    navigator.serviceWorker
      .register(document.currentScript.src)
      .then(function (reg) {
        function onStateChange() {
          if (this.state === 'installed' || this.state === 'activated') {
            window.location.reload();
          }
        }
        if (reg.installing) reg.installing.addEventListener('statechange', onStateChange);
        else if (reg.waiting) reg.waiting.addEventListener('statechange', onStateChange);
        else if (reg.active && !navigator.serviceWorker.controller) window.location.reload();
      })
      .catch(function (err) { console.error('coi-serviceworker registration failed', err); });
  }
}
