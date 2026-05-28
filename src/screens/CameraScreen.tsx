import { useEffect, useRef, useState, useCallback } from "react";
import type React from "react";
import type { FilterId, GestureState, PalmPosition } from "../types";
import { useCamera } from "../hooks/useCamera";
import { useGestureDetection } from "../hooks/useGestureDetection";
import CountdownOverlay from "../components/CountdownOverlay";
import GestureFeedback from "../components/GestureFeedback";
import HandOverlay from "../components/HandOverlay";
import { FILTER_OVERLAYS, compositeWithOverlay } from "../filterOverlays";

const BASE_SCALE  = 1.15;
const ZOOM_MAX_SCALE = 1.6;
const PAN_SCALE   = 180;
const TILT_SCALE  = 120;

interface Props {
  activeFilter: FilterId;
  onCapture: (dataUrl: string) => void;
}

export default function CameraScreen({ activeFilter, onCapture }: Props) {
  const { videoRef, isReady, error: cameraError, captureFrame } = useCamera();
  const [gestureState, setGestureState] = useState<GestureState>("waiting");

  const calibrationRef = useRef<PalmPosition | null>(null);

  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [countdownActive, setCountdownActive] = useState(false);

  const { gesture, palmPosition, landmarksRef, isLoading, error: gestureError, peaceSignProgress, handSize } =
    useGestureDetection({ videoRef, enabled: isReady, gestureState });

  const zoomScale = gestureState === "waiting"
    ? BASE_SCALE
    : BASE_SCALE + handSize * (ZOOM_MAX_SCALE - BASE_SCALE);

  // ── Gesture state machine ─────────────────────────────────────────────────
  useEffect(() => {
    if (gestureState === "waiting") {
      if (gesture === "open_palm" && palmPosition) {
        calibrationRef.current = palmPosition;
        setGestureState("calibrated");
      }
    }

    if (gestureState === "calibrated") {
      if (gesture === "open_palm" && palmPosition && calibrationRef.current) {
        const dx = palmPosition.x - calibrationRef.current.x;
        const dy = palmPosition.y - calibrationRef.current.y;
        setPanX(-dx * PAN_SCALE);
        setPanY( dy * TILT_SCALE);
      }

      if (gesture === "peace_sign" && peaceSignProgress >= 1 && !countdownActive) {
        setCountdownActive(true);
        setGestureState("countdown");
      }
    }

    if (gestureState === "countdown" && countdownActive) {
      if (gesture === "open_palm") {
        setCountdownActive(false);
        setGestureState("calibrated");
      }
    }

  }, [gesture, gestureState, palmPosition, peaceSignProgress, countdownActive]);


  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCountdownComplete = useCallback(async () => {
    setCountdownActive(false);
    const rawDataUrl = captureFrame();
    if (!rawDataUrl) return;

    const overlayUrl = FILTER_OVERLAYS[activeFilter];
    if (overlayUrl) {
      const composited = await compositeWithOverlay(rawDataUrl, overlayUrl);
      onCapture(composited);
    } else {
      onCapture(rawDataUrl);
    }
  }, [captureFrame, onCapture, activeFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  const error = cameraError ?? gestureError;
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-sand gap-4">
        <p className="text-primary/50 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">

      {/* ── Video + hand overlay ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
          transition: "transform 0.15s ease-out",
        }}
      >
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
        />
        <HandOverlay
          landmarksRef={landmarksRef}
          gestureState={gestureState}
          visible={gestureState !== "waiting" && gestureState !== "countdown" && !isLoading && isReady}
        />
      </div>

      {/* ── Border overlay (fixed, not subject to pan/tilt) ──────────────── */}
      {FILTER_OVERLAYS[activeFilter] && (
        <img
          src={FILTER_OVERLAYS[activeFilter]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          aria-hidden
        />
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {(isLoading || !isReady) && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-white/50 text-xs tracking-widest uppercase">
            {!isReady ? "Starting camera…" : "Loading gesture model…"}
          </p>
        </div>
      )}

      {/* ── Calibrated banner ─────────────────────────────────────────────── */}
      {gestureState === "calibrated" && !countdownActive && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 glass rounded-full px-6 py-2 animate-fade-in">
          <p className="text-green-300 text-xs tracking-widest uppercase">
            Calibration Complete
          </p>
        </div>
      )}

      {/* ── Rule-of-thirds grid ───────────────────────────────────────────── */}
      {gestureState !== "waiting" && !countdownActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/3 border-l border-white/5" />
          <div className="absolute top-0 bottom-0 right-1/3 border-l border-white/5" />
          <div className="absolute left-0 right-0 top-1/3 border-t border-white/5" />
          <div className="absolute left-0 right-0 bottom-1/3 border-t border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8">
            <div className="absolute top-1/2 w-full border-t border-white/20" />
            <div className="absolute left-1/2 h-full border-l border-white/20" />
          </div>
        </div>
      )}

      {/* ── Peace sign hold progress indicator ───────────────────────────── */}
      {gestureState === "calibrated" && gesture === "peace_sign" && peaceSignProgress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="rgba(26,101,123,0.20)"
                strokeWidth="5"
              />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#B5D7C5"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - peaceSignProgress)}`}
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/70 text-xs tracking-widest uppercase">
                {peaceSignProgress >= 1 ? "Go!" : `${Math.ceil(3 * (1 - peaceSignProgress))}s`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Countdown ─────────────────────────────────────────────────────── */}
      {countdownActive && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      {/* ── Gesture feedback ──────────────────────────────────────────────── */}
      {!isLoading && isReady && (
        <GestureFeedback
          gesture={gesture}
          gestureState={gestureState}
          peaceSignProgress={peaceSignProgress}
        />
      )}
    </div>
  );
}
