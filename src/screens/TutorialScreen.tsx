import { useState, useEffect } from "react";
import type React from "react";
import {
  OpenPalmIcon,
  PeaceSignIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "../components/GestureIcons";
import { useCamera } from "../hooks/useCamera";
import { useGestureDetection } from "../hooks/useGestureDetection";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

type RequiredGesture = "open_palm" | "peace_sign" | "thumbs_up" | "thumbs_down";

interface TutorialStep {
  title: string;
  description: string;
  illustration: React.ReactNode;
  requiredGesture: RequiredGesture;
}

const STEPS: TutorialStep[] = [
  {
    title: "Calibrate",
    description: "Hold up an open palm to calibrate the camera.",
    illustration: <OpenPalmIcon className="w-9 h-11" />,
    requiredGesture: "open_palm",
  },
  {
    title: "Start Countdown",
    description: "Hold a peace sign to start the photo countdown.",
    illustration: <PeaceSignIcon className="w-9 h-11" />,
    requiredGesture: "peace_sign",
  },
  {
    title: "During Countdown",
    description:
      "Keep posing naturally while the countdown runs. Only an open palm will cancel it.",
    illustration: <ThumbsUpIcon className="w-9 h-11" />,
    requiredGesture: "thumbs_up",
  },
  {
    title: "Cancel Countdown",
    description:
      "Show an open palm at any point during the countdown to cancel.",
    illustration: <OpenPalmIcon className="w-9 h-11" />,
    requiredGesture: "open_palm",
  },
  {
    title: "Confirm & Save",
    description: "After your photo is taken, give a thumbs up to save it.",
    illustration: <ThumbsUpIcon className="w-9 h-11" />,
    requiredGesture: "thumbs_up",
  },
  {
    title: "Retake",
    description:
      "Or show a thumbs down to discard the photo and try again.",
    illustration: <ThumbsDownIcon className="w-9 h-11" />,
    requiredGesture: "thumbs_down",
  },
];

const GESTURE_NAMES: Record<RequiredGesture, string> = {
  open_palm: "open palm",
  peace_sign: "peace sign",
  thumbs_up: "thumbs up",
  thumbs_down: "thumbs down",
};

export default function TutorialScreen({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [succeeded, setSucceeded] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const { videoRef, isReady } = useCamera();
  const { gesture, isLoading } = useGestureDetection({
    videoRef,
    enabled: isReady,
    gestureState: "waiting",
  });

  const gestureMatches = gesture === current.requiredGesture;

  // Reset success state when step changes
  useEffect(() => {
    setSucceeded(false);
  }, [step]);

  // Require 500ms of continuous correct gesture before marking success
  useEffect(() => {
    if (!gestureMatches || succeeded) return;
    const t = setTimeout(() => setSucceeded(true), 500);
    return () => clearTimeout(t);
  }, [gestureMatches, succeeded]);

  // Auto-advance 800ms after success so the indicator is visible briefly
  useEffect(() => {
    if (!succeeded) return;
    const t = setTimeout(() => {
      if (isLast) onComplete();
      else setStep((s) => s + 1);
    }, 800);
    return () => clearTimeout(t);
  }, [succeeded, isLast, onComplete]);

  const feedbackText = (() => {
    if (!isReady || isLoading) return "Starting camera…";
    if (succeeded) return "Gesture detected!";
    if (gestureMatches) return "Hold it…";
    return `Show your ${GESTURE_NAMES[current.requiredGesture]}`;
  })();

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] animate-fade-in">

      {/* Camera viewport — primary visual focus, roughly 2/3 of screen height */}
      <div className="flex justify-center pt-4 px-4 flex-shrink-0">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{ width: "min(60vh, 88vw)", aspectRatio: "1 / 1" }}
        >
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
          />

          {/* Gesture reference badge — bottom-right corner */}
          <div
            className={`absolute bottom-3 right-3 w-12 h-12 rounded-full border flex items-center justify-center transition-colors duration-300 ${
              gestureMatches || succeeded
                ? "border-green-400/40 bg-green-400/10"
                : "border-white/20 bg-black/50"
            }`}
          >
            {current.illustration}
          </div>

          {/* Subtle glow when gesture is matching but not yet confirmed */}
          {gestureMatches && !succeeded && (
            <div className="absolute inset-0 bg-green-400/10 pointer-events-none" />
          )}

          {/* Success overlay */}
          {succeeded && (
            <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center pointer-events-none animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-400/90 flex items-center justify-center shadow-xl shadow-green-400/30">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {(!isReady || isLoading) && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border border-white/30 border-t-white/80 rounded-full animate-spin" />
              <p className="text-white/30 text-xs tracking-widest uppercase">
                {!isReady ? "Starting camera…" : "Loading…"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 min-h-0">

        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <h2 className="text-2xl font-light tracking-widest uppercase text-white/90">
            {current.title}
          </h2>
          <p className="text-white/50 text-base leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Real-time gesture feedback */}
        <div
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm tracking-wide glass-dark transition-all duration-300 ${
            succeeded || gestureMatches ? "text-green-400" : "text-white/40"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
              gestureMatches || succeeded ? "bg-green-400" : "bg-white/20"
            }`}
          />
          {feedbackText}
        </div>

        {/* Step progress dots */}
        <div className="flex gap-2.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step ? "w-5 h-2 bg-white/70" : "w-2 h-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation — Back on left, Skip on bottom-right */}
      <div className="flex items-center justify-between px-8 pb-8">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={isFirst}
          className="px-8 py-3.5 rounded-full border border-white/15 text-white/50 text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-0 hover:enabled:bg-white/10 hover:enabled:border-white/30 hover:enabled:text-white/80"
        >
          Back
        </button>
        <button
          onClick={onSkip}
          className="glass-dark px-5 py-2.5 rounded-full text-white/40 text-sm tracking-widest uppercase hover:text-white/70 transition-colors duration-200"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}
