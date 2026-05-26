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
      {/* Hidden video — camera stream for MediaPipe; not displayed */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className="absolute opacity-0 pointer-events-none w-px h-px"
        playsInline
        muted
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">

        {/* Illustration with progress arc */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border border-white/10" />

          {/* Inner ring with icon */}
          <div className="w-36 h-36 rounded-full border border-white/15 flex items-center justify-center text-white">
            <ThumbsUpIcon className="w-24 h-28" />
          </div>

          {/* Progress arc — drawn over the outer ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
            fill="none"
          >
            {/* Track */}
            <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="1.5" opacity="0.12" />
            {/* Fill */}
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

          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse-ring" />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4 text-center animate-slide-up max-w-xs">
          {isLoading ? (
            <p className="text-white/30 text-xs tracking-widest uppercase">Initializing...</p>
          ) : (
            <>
              <h2 className="text-2xl font-light tracking-widest uppercase text-white/90">
                {isHolding ? "Hold it..." : "Ready?"}
              </h2>
              <p className="text-white/50 text-base leading-relaxed">
                Hold a thumbs up to start the camera
              </p>
            </>
          )}
        </div>
      </div>

      {/* Accessible fallback */}
      <div className="flex justify-center px-8 pb-10">
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
