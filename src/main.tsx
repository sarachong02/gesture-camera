import { Component, StrictMode } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// ── Error boundary ─────────────────────────────────────────────────────────
// Catches any unhandled render error and shows a recoverable fallback instead
// of a blank white screen. Critical on iOS Safari where errors are harder to
// surface in the absence of DevTools.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GestureCamera] Render error:", error.message);
    console.error("[GestureCamera] Component stack:", info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: "fixed", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "2rem",
          background: "#111827", color: "#f5edde",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center", gap: "1rem",
        }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: "0.875rem", opacity: 0.65, maxWidth: 300, lineHeight: 1.5 }}>
            Please allow camera access, then refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "0.5rem", padding: "0.75rem 2rem",
              borderRadius: 12, border: "1px solid #1A657C",
              background: "rgba(245,238,222,0.12)", color: "#f5edde",
              fontSize: "1rem", cursor: "pointer",
            }}
          >
            Refresh
          </button>
          <details style={{ marginTop: "1rem", opacity: 0.35, fontSize: "0.75rem", maxWidth: 320 }}>
            <summary style={{ cursor: "pointer" }}>Error details</summary>
            <pre style={{ textAlign: "left", whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>
              {this.state.error.message}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── TEMP: iOS/iPadOS detection — inject style before React mounts ──────────
// Injecting a <style> element here (before createRoot) gives it higher
// source-order than the linked CSS bundle, so it wins regardless of cascade.
// CSS class approach (.ios .animate-X) was losing to the animation engine;
// a dynamically-appended <style> with !important cannot be overridden.
const _isIOS = navigator.maxTouchPoints > 1 || CSS.supports('-webkit-touch-callout', 'none');
if (_isIOS) {
  document.documentElement.classList.add('ios');
  const _s = document.createElement('style');
  _s.id = 'ios-anim-fix';
  _s.textContent =
    '.animate-fade-in{animation:none!important;opacity:1!important}' +
    '.animate-slide-up{animation:none!important;opacity:1!important;transform:translateY(0)!important}';
  document.head.appendChild(_s);
  console.log('[iOS fallback] iOS/iPadOS detected — maxTouchPoints:', navigator.maxTouchPoints);
}

// ── Startup diagnostics (visible in Safari Web Inspector) ──────────────────
console.log("[GestureCamera] Startup — UA:", navigator.userAgent);
console.log("[GestureCamera] crossOriginIsolated:", (window as Window & { crossOriginIsolated?: boolean }).crossOriginIsolated ?? "undefined");
console.log("[GestureCamera] mediaDevices:", !!navigator.mediaDevices);
console.log("[GestureCamera] serviceWorker:", "serviceWorker" in navigator);
console.log("[GestureCamera] WebGL:", !!document.createElement("canvas").getContext("webgl"));

// ── Mount ──────────────────────────────────────────────────────────────────
const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[GestureCamera] #root element not found — cannot mount app.");
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
