import { useEffect, useRef, useState, useCallback } from "react";
import type React from "react";
import type { GestureState, PalmPosition, PhotoType } from "../types";
import { useCamera } from "../hooks/useCamera";
import { useGestureDetection } from "../hooks/useGestureDetection";
import CountdownOverlay from "../components/CountdownOverlay";
import GestureFeedback from "../components/GestureFeedback";
import HandOverlay from "../components/HandOverlay";

const BASE_SCALE  = 1.15;
const PAN_SCALE   = 180;
const TILT_SCALE  = 120;

interface Props {
  photoType: PhotoType;
  onCapture: (dataUrl: string) => void;
}

export default function CameraScreen({ photoType, onCapture }: Props) {
  const { videoRef, isReady, error: cameraError, captureFrame } = useCamera();
  const [gestureState, setGestureState] = useState<GestureState>("waiting");

  const calibrationRef = useRef<PalmPosition | null>(null);

  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [countdownActive, setCountdownActive] = useState(false);

  const { gesture, palmPosition, landmarksRef, isLoading, error: gestureError } =
    useGestureDetection({ videoRef, enabled: isReady && gestureState !== "countdown" });

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
        setPanX(-dx * PAN_SCALE); // negate: video is displayed scaleX(-1)
        setPanY( dy * TILT_SCALE);
      }

      if (gesture === "closed_fist" && !countdownActive) {
        setCountdownActive(true);
        setGestureState("countdown");
      }
    }

  }, [gesture, gestureState, palmPosition, countdownActive]);


  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCountdownComplete = useCallback(() => {
    setCountdownActive(false);
    const dataUrl = captureFrame();
    if (dataUrl) onCapture(dataUrl);
  }, [captureFrame, onCapture]);

  // ── Render ────────────────────────────────────────────────────────────────
  const error = cameraError ?? gestureError;
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <p className="text-white/40 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">

      {/* ── Video + hand overlay ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${BASE_SCALE})`,
          transition: "transform 0.12s ease-out",
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

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {(isLoading || !isReady) && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="w-8 h-8 border border-white/30 border-t-white/80 rounded-full animate-spin" />
          <p className="text-white/40 text-xs tracking-widest uppercase">
            {!isReady ? "Starting camera…" : "Loading gesture model…"}
          </p>
        </div>
      )}

      {/* ── Calibrated banner ─────────────────────────────────────────────── */}
      {gestureState === "calibrated" && !countdownActive && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 glass-dark rounded-full px-6 py-2 animate-fade-in">
          <p className="text-green-300 text-xs tracking-widest uppercase">
            Calibration Complete
          </p>
        </div>
      )}

      {/* ── Photo type badge ──────────────────────────────────────────────── */}
      {!isLoading && isReady && (
        <div className="absolute top-8 right-8 glass-dark rounded-full px-4 py-1.5">
          <p className="text-white/40 text-xs tracking-wide">
            {photoType === "physical" ? "Digital + Physical · $2" : "Digital"}
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

      {/* ── Countdown ─────────────────────────────────────────────────────── */}
      {countdownActive && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      {/* ── Gesture feedback ──────────────────────────────────────────────── */}
      {!isLoading && isReady && (
        <GestureFeedback gesture={gesture} gestureState={gestureState} />
      )}
    </div>
  );
}
