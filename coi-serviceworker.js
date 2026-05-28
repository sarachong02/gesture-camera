/* coi-serviceworker v0.1.7 - Guido Zuidhof - MIT License (iOS Safari patched)
 * Adds COOP/COEP headers via service worker so SharedArrayBuffer
 * (required by MediaPipe WASM) works on hosts that can't set custom
 * HTTP headers (e.g. GitHub Pages).
 *
 * iOS Safari patch: remove Content-Encoding and Content-Length from proxied
 * responses. The fetch API already decoded the body; keeping these headers
 * causes iOS Safari to attempt double-decoding → garbled JS → blank screen.
 * A sessionStorage reload counter prevents infinite reload loops on iOS where
 * crossOriginIsolated can never become true for navigation requests.
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
          // Remove encoding/length headers: the fetch API decompresses the body
          // transparently. Keeping Content-Encoding causes iOS Safari to try to
          // decompress the already-decoded body a second time → corrupt assets.
          headers.delete('Content-Encoding');
          headers.delete('Content-Length');
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
  // Use window.crossOriginIsolated to avoid ReferenceError on older browsers.
  var isolated = typeof window.crossOriginIsolated !== 'undefined'
    ? window.crossOriginIsolated
    : false;

  if (isolated) {
    // Successfully cross-origin isolated — clear the reload counter.
    try { sessionStorage.removeItem('coi-reloads'); } catch (e) {}
  } else {
    // Prevent infinite reload loops on iOS Safari where crossOriginIsolated
    // stays false even after the service worker is active (iOS cannot add
    // COOP/COEP headers to navigation requests via service workers).
    var reloadCount = 0;
    try { reloadCount = parseInt(sessionStorage.getItem('coi-reloads') || '0', 10); } catch (e) {}

    if (reloadCount >= 2) {
      // Give up — app will run without crossOriginIsolated (GPU delegate
      // doesn't need SharedArrayBuffer, so MediaPipe still works).
      console.warn('coi-serviceworker: could not achieve cross-origin isolation after', reloadCount, 'reloads; proceeding without.');
    } else if (!('serviceWorker' in navigator)) {
      // Private browsing mode on iOS or unsupported browser — skip registration.
      console.warn('coi-serviceworker: service workers not supported, proceeding without cross-origin isolation.');
    } else if (!document.currentScript || !document.currentScript.src) {
      // Happens in certain inline/dynamic script contexts — cannot self-register.
      console.warn('coi-serviceworker: document.currentScript unavailable, skipping registration.');
    } else {
      var swSrc = document.currentScript.src;
      navigator.serviceWorker
        .register(swSrc)
        .then(function (reg) {
          function onStateChange() {
            if (this.state === 'installed' || this.state === 'activated') {
              try { sessionStorage.setItem('coi-reloads', String(reloadCount + 1)); } catch (e) {}
              window.location.reload();
            }
          }
          if (reg.installing) reg.installing.addEventListener('statechange', onStateChange);
          else if (reg.waiting) reg.waiting.addEventListener('statechange', onStateChange);
          else if (reg.active && !navigator.serviceWorker.controller) {
            try { sessionStorage.setItem('coi-reloads', String(reloadCount + 1)); } catch (e) {}
            window.location.reload();
          }
        })
        .catch(function (err) { console.error('coi-serviceworker registration failed', err); });
    }
  }
}
