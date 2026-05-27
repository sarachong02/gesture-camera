import type React from "react";
import { useCamera } from "../hooks/useCamera";
import { useThumbsUpDetection } from "../hooks/useThumbsUpDetection";
import { ThumbsUpIcon } from "../components/GestureIcons";

interface Props {
  onEnter: () => void;
}

const CIRC = 2 * Math.PI * 48;

export default function CameraGateScreen({ onEnter }: Props) {
  const { videoRef } = useCamera();
  const { isLoading, progress } = useThumbsUpDetection({ videoRef, onDetected: onEnter });

  const isHolding = progress > 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] animate-fade-in">

      {/* Camera viewport with progress arc overlay */}
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

          {/* Progress arc overlay — inscribed circle that fills as thumbs-up is held */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="1" opacity="0.12" />
            {isHolding && (
              <circle
                cx="50" cy="50" r="48"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
                style={{ transition: "stroke-dashoffset 0.05s linear" }}
              />
            )}
          </svg>

          {/* Gesture reference badge — bottom-right corner */}
          <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full border border-white/20 bg-black/50 flex items-center justify-center">
            <ThumbsUpIcon className="w-9 h-11" />
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border border-white/30 border-t-white/80 rounded-full animate-spin" />
              <p className="text-white/30 text-xs tracking-widest uppercase">Loading…</p>
            </div>
          )}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        {isLoading ? (
          <p className="text-white/30 text-xs tracking-widest uppercase">Initializing...</p>
        ) : (
          <>
            <h2 className="text-xl font-light tracking-widest uppercase text-white/90">
              {isHolding ? "Hold it..." : "Ready?"}
            </h2>
            <p className="text-white/50 text-sm leading-relaxed text-center max-w-xs">
              Hold a thumbs up to start the camera
            </p>
          </>
        )}
      </div>

      {/* Accessible fallback */}
      <div className="flex justify-center px-8 pb-8">
        <button
          onClick={onEnter}
          className="px-10 py-3.5 rounded-full border border-white/20 text-white/50 text-sm tracking-widest uppercase hover:bg-white/10 hover:border-white/40 hover:text-white/80 transition-all duration-300"
        >
          Start Camera
        </button>
      </div>
    </div>
  );
}
