import { useEffect, useState } from "react";

// ── Audio ──────────────────────────────────────────────────────────────────
// Module-level singleton so sounds keep playing even after the component unmounts
// (which happens the instant onComplete transitions to the capture screen).
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, durationSec: number, volume = 0.22) {
  const ctx = getAudioCtx();
  // Resume handles browsers that suspend AudioContext until user interaction
  void ctx.resume().then(() => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Quick attack, exponential decay to silence
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSec + 0.01);
  });
}

// Tick beep — pitch rises on the final second to build anticipation
function playTick(count: number) {
  const freq = count === 1 ? 660 : 440; // A4 standard, E5 on last second
  playTone(freq, 0.08);
}

// Shutter sound — brief ascending chirp to mimic a camera click
function playShutter() {
  const ctx = getAudioCtx();
  void ctx.resume().then(() => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
  });
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

// SVG circle circumference for r=40: 2π×40 ≈ 251.2
const CIRCUMFERENCE = 251.2;

export default function CountdownOverlay({ onComplete }: Props) {
  const [count, setCount]       = useState(5);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (count === 0) {
      playShutter();
      onComplete();
      return;
    }

    // Beep at the start of each second
    playTick(count);

    // Animate the arc within this second using rAF
    let start: number | null = null;
    let raf: number;

    function tick(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      setProgress(Math.min(elapsed / 1000, 1));
      if (elapsed < 1000) {
        raf = requestAnimationFrame(tick);
      } else {
        setProgress(0);
        setCount((c) => c - 1);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count, onComplete]);

  // strokeDashoffset: 0 = full arc, CIRCUMFERENCE = empty
  const dashOffset = CIRCUMFERENCE * progress;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <svg width="120" height="120" className="-rotate-90">
          <circle
            cx="60" cy="60" r="40"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          <circle
            cx="60" cy="60" r="40"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>

        <span className="absolute text-white text-5xl font-light tabular-nums">
          {count}
        </span>

        <p className="text-white/50 text-xs tracking-widest uppercase mt-16">
          Hold still
        </p>
      </div>
    </div>
  );
}
