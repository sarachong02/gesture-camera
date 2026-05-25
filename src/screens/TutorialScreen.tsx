import { useState } from "react";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

interface Step {
  title: string;
  description: string;
  illustration: React.ReactNode;
}

function OpenPalmIcon() {
  return (
    <svg viewBox="0 0 64 80" fill="none" className="w-20 h-24" aria-hidden>
      {/* Palm */}
      <rect x="10" y="42" width="44" height="32" rx="10" fill="currentColor" opacity="0.7" />
      {/* Thumb */}
      <rect x="4" y="34" width="11" height="22" rx="5.5" fill="currentColor" opacity="0.7" transform="rotate(-20 9.5 45)" />
      {/* Index */}
      <rect x="14" y="8" width="11" height="38" rx="5.5" fill="currentColor" opacity="0.7" />
      {/* Middle */}
      <rect x="27" y="4" width="11" height="42" rx="5.5" fill="currentColor" opacity="0.7" />
      {/* Ring */}
      <rect x="40" y="8" width="10" height="38" rx="5" fill="currentColor" opacity="0.7" />
      {/* Pinky */}
      <rect x="51" y="14" width="9" height="32" rx="4.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function PeaceSignIcon() {
  return (
    <svg viewBox="0 0 64 80" fill="none" className="w-20 h-24" aria-hidden>
      {/* Palm */}
      <rect x="10" y="42" width="44" height="32" rx="10" fill="currentColor" opacity="0.7" />
      {/* Thumb (tucked) */}
      <rect x="12" y="46" width="10" height="16" rx="5" fill="currentColor" opacity="0.5" />
      {/* Index — extended */}
      <rect x="14" y="8" width="11" height="38" rx="5.5" fill="currentColor" opacity="0.7" />
      {/* Middle — extended */}
      <rect x="27" y="4" width="11" height="42" rx="5.5" fill="currentColor" opacity="0.7" />
      {/* Ring — curled */}
      <rect x="40" y="34" width="10" height="12" rx="5" fill="currentColor" opacity="0.5" />
      {/* Pinky — curled */}
      <rect x="51" y="36" width="9" height="10" rx="4.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function CountdownIcon() {
  return (
    <div className="flex items-end gap-1.5">
      {["5", "4", "3"].map((n, i) => (
        <span
          key={n}
          className="font-bold tabular-nums text-white"
          style={{
            fontSize: i === 1 ? "4rem" : "2.5rem",
            opacity: i === 1 ? 0.85 : 0.3,
            lineHeight: 1,
          }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

const STEPS: Step[] = [
  {
    title: "Calibrate",
    description: "Hold up an open palm to calibrate the camera.",
    illustration: <OpenPalmIcon />,
  },
  {
    title: "Start Countdown",
    description: "Hold a peace sign for 3 seconds to start the photo countdown.",
    illustration: <PeaceSignIcon />,
  },
  {
    title: "During Countdown",
    description:
      "Keep posing naturally. The countdown won't stop for normal hand movements — only an open palm will cancel it.",
    illustration: <CountdownIcon />,
  },
  {
    title: "Cancel Countdown",
    description: "Show an open palm at any point during the countdown to cancel.",
    illustration: <OpenPalmIcon />,
  },
];

export default function TutorialScreen({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] animate-fade-in">

      {/* Skip button */}
      <div className="flex justify-end px-8 pt-8">
        <button
          onClick={onSkip}
          className="glass-dark px-5 py-2 rounded-full text-white/40 text-xs tracking-widest uppercase hover:text-white/70 transition-colors duration-200"
        >
          Skip Tutorial
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-10">

        {/* Illustration ring — matches StartScreen's decorative pattern */}
        <div className="relative flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-white/10 flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border border-white/15 flex items-center justify-center text-white">
              {current.illustration}
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse-ring" />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4 max-w-sm text-center animate-slide-up">
          <h2 className="text-2xl font-light tracking-widest uppercase text-white/90">
            {current.title}
          </h2>
          <p className="text-white/50 text-base leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex gap-2.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? "w-5 h-2 bg-white/70"
                  : "w-2 h-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-8 pb-10">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={isFirst}
          className="px-8 py-3.5 rounded-full border border-white/15 text-white/50 text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-0 hover:enabled:bg-white/10 hover:enabled:border-white/30 hover:enabled:text-white/80"
        >
          Back
        </button>

        <button
          onClick={isLast ? onComplete : () => setStep((s) => s + 1)}
          className="px-10 py-3.5 rounded-full border border-white/20 text-white/80 text-sm tracking-widest uppercase hover:bg-white/10 hover:border-white/40 transition-all duration-300"
        >
          {isLast ? "Let's Go" : "Next"}
        </button>
      </div>
    </div>
  );
}
