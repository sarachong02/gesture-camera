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

  useEffect(() => {
    setSucceeded(false);
  }, [step]);

  useEffect(() => {
    if (!gestureMatches || succeeded) return;
    const t = setTimeout(() => setSucceeded(true), 500);
    return () => clearTimeout(t);
  }, [gestureMatches, succeeded]);

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
    <div className="w-full h-full flex flex-col animate-fade-in">

      {/* Camera viewport */}
      <div className="flex justify-center pt-4 px-4 flex-shrink-0">
        <div
          className="relative overflow-hidden rounded-2xl border border-primary/25"
          style={{ width: "min(60vh, 88vw)", aspectRatio: "1 / 1" }}
        >
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
          />

          {/* Gesture reference badge */}
          <div
            className={`absolute bottom-3 right-3 w-12 h-12 rounded-full border flex items-center justify-center transition-colors duration-300 ${
              gestureMatches || succeeded
                ? "border-green-400/40 bg-green-400/10"
                : "border-primary/25 bg-black/40"
            }`}
          >
            {current.illustration}
          </div>

          {/* Subtle glow when gesture matches */}
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
              <div className="w-6 h-6 border border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-white/50 text-xs tracking-widest uppercase">
                {!isReady ? "Starting camera…" : "Loading…"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 min-h-0">

        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <h2 className="font-display text-3xl font-normal text-primary">
            {current.title}
          </h2>
          <p className="text-primary/70 text-base leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Real-time gesture feedback */}
        <div
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-pill text-sm tracking-wide glass-card-teal transition-all duration-300 ${
            succeeded || gestureMatches ? "text-green-600" : "text-primary/60"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
              gestureMatches || succeeded ? "bg-green-500" : "bg-primary/30"
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
                i === step ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-primary/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-8 pb-8">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={isFirst}
          className="btn btn-ghost tracking-widest uppercase"
        >
          Back
        </button>
        <button
          onClick={onSkip}
          className="glass-card px-5 py-2.5 rounded-pill text-primary/50 text-sm tracking-widest uppercase hover:text-primary/80 transition-colors duration-200"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}
