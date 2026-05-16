import { useEffect, useRef } from "react";
import type { GestureState } from "../types";
import type { Landmark } from "../hooks/useGestureDetection";

// ── Hand skeleton topology (MediaPipe standard) ────────────────────────────
const CONNECTIONS: [number, number][] = [
  [0, 1],  [1, 2],  [2, 3],  [3, 4],   // thumb
  [0, 5],  [5, 6],  [6, 7],  [7, 8],   // index
  [5, 9],  [9, 10], [10, 11],[11, 12], // middle
  [9, 13], [13, 14],[14, 15],[15, 16], // ring
  [13, 17],[17, 18],[18, 19],[19, 20], // pinky
  [0, 17],                              // palm lateral edge
];

// Landmark groups for styling
const TIP_INDICES  = new Set([4, 8, 12, 16, 20]);
const MCP_INDICES  = new Set([1, 5, 9, 13, 17]);  // thumb CMC + finger MCPs
const WRIST_INDEX  = 0;

// ── Color themes per gesture state ────────────────────────────────────────
function palette(state: GestureState) {
  if (state === "countdown") {
    return {
      line:   "rgba(251, 191, 36, 0.75)",  // amber
      glow:   "rgba(251, 191, 36, 0.40)",
      node:   "#fbbf24",
      ring:   "rgba(251, 191, 36, 0.25)",
    };
  }
  // calibrated (green)
  return {
    line:   "rgba(74, 222, 128, 0.75)",
    glow:   "rgba(74, 222, 128, 0.40)",
    node:   "#4ade80",
    ring:   "rgba(74, 222, 128, 0.20)",
  };
}

// ── Canvas draw call ───────────────────────────────────────────────────────
function drawHand(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  w: number,
  h: number,
  state: GestureState
) {
  const { line, glow, node, ring } = palette(state);

  ctx.save();
  ctx.lineCap = "round";

  // ── Connections ──────────────────────────────────────────────────────────
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;

  for (const [a, b] of CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  }

  // ── Nodes ────────────────────────────────────────────────────────────────
  for (let i = 0; i < lm.length; i++) {
    const x = lm[i].x * w;
    const y = lm[i].y * h;
    const isTip    = TIP_INDICES.has(i);
    const isMajor  = MCP_INDICES.has(i) || i === WRIST_INDEX;
    const r        = isTip ? 4.5 : isMajor ? 3.5 : 2.5;

    // Outer pulse ring — tips and wrist only
    if (isTip || i === WRIST_INDEX) {
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = ring;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.stroke();
    }

    // Node fill
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = node;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.fill();

    // White specular dot for depth
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.shadowBlur = 0;
    ctx.fill();
  }

  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  gestureState: GestureState;
  visible: boolean;
}

export default function HandOverlay({ landmarksRef, gestureState, visible }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Track gestureState in a ref so the rAF loop always reads the latest value
  // without needing to restart on every state change
  const gestureStateRef = useRef<GestureState>(gestureState);
  gestureStateRef.current = gestureState;

  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Keep canvas bitmap size in sync with its CSS layout size
    function syncSize() {
      if (!canvas) return;
      const { offsetWidth: w, offsetHeight: h } = canvas;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
      }
    }

    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    syncSize();

    let raf: number;

    function frame() {
      if (!canvas) { raf = requestAnimationFrame(frame); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx)   { raf = requestAnimationFrame(frame); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lm = landmarksRef.current;
      if (visibleRef.current && lm) {
        drawHand(ctx, lm, canvas.width, canvas.height, gestureStateRef.current);
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // landmarksRef is a stable ref object — only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      // Mirror to match the scaleX(-1) applied to the <video> sibling
      style={{ transform: "scaleX(-1)" }}
    />
  );
}
