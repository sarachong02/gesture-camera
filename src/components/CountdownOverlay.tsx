import { useEffect, useRef, useState } from "react";

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

function playTick() {
  playTone(440, 1.0);
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
}

export default function CountdownOverlay({ onComplete }: Props) {
  const [count, setCount] = useState(5);

  // Keep onComplete in a ref so the timer effect never has it as a dep.
  // If it were a dep, any parent re-render that produces a new onComplete
  // reference would cancel + restart the 1-second rAF tick, pausing the
  // countdown while a hand is visible in frame.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (count === 0) {
      playShutter();
      onCompleteRef.current();
      return;
    }

    playTick();

    // Advance count by 1 after exactly 1 000 ms using rAF timestamps
    let start: number | null = null;
    let raf: number;

    function tick(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      if (elapsed < 1000) {
        raf = requestAnimationFrame(tick);
      } else {
        setCount((c) => c - 1);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]); // onComplete intentionally omitted — read via ref above

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <span
          className="text-white tabular-nums"
          style={{ fontSize: 210, fontFamily: "Inter, sans-serif", fontWeight: 700, lineHeight: 1 }}
        >
          {count}
        </span>

        <p className="text-white/50 text-xs tracking-widest uppercase">
          Hold still
        </p>
      </div>
    </div>
  );
}
