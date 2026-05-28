import { useState, useEffect, useRef, useCallback } from "react";
import type React from "react";
import { ThumbsUpIcon, ThumbsDownIcon } from "../components/GestureIcons";
import { useCamera } from "../hooks/useCamera";
import { useGestureDetection } from "../hooks/useGestureDetection";
import type { FilterId } from "../types";
import logo from "../../images/logo.png";

interface Props {
  imageUrl: string;
  activeFilter: FilterId;
  onRetake: () => void;
  onSave: () => void;
}

const THUMBS_HOLD_MS = 500;
const ARC_R = 44;
const ARC_CIRC = 2 * Math.PI * ARC_R;

export default function CaptureScreen({ imageUrl, activeFilter, onRetake, onSave }: Props) {
  const [gestureAction, setGestureAction] = useState<"save" | "retake" | null>(null);
  const [thumbsProgress, setThumbsProgress] = useState(0);
  const thumbsStartRef = useRef<number | null>(null);
  const thumbsRafRef   = useRef<number | null>(null);

  const handleSaveRef = useRef<() => void>(null!);
  const onRetakeRef   = useRef<() => void>(null!);

  handleSaveRef.current = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `gesture-photo-${Date.now()}.jpg`;
    link.click();
    onSave();
  };
  onRetakeRef.current = onRetake;

  const { videoRef, isReady } = useCamera();
  const { gesture } = useGestureDetection({
    videoRef,
    enabled: isReady,
    gestureState: "waiting",
  });

  const stopThumbsArc = useCallback(() => {
    if (thumbsRafRef.current) cancelAnimationFrame(thumbsRafRef.current);
    thumbsStartRef.current = null;
    setThumbsProgress(0);
  }, []);

  useEffect(() => {
    if (gestureAction) { stopThumbsArc(); return; }
    if (gesture !== "thumbs_up" && gesture !== "thumbs_down") { stopThumbsArc(); return; }

    if (thumbsStartRef.current === null) thumbsStartRef.current = performance.now();

    function tick() {
      if (!thumbsStartRef.current) return;
      const p = Math.min((performance.now() - thumbsStartRef.current) / THUMBS_HOLD_MS, 1);
      setThumbsProgress(p);
      if (p < 1) {
        thumbsRafRef.current = requestAnimationFrame(tick);
      } else {
        setGestureAction(gesture === "thumbs_up" ? "save" : "retake");
      }
    }
    thumbsRafRef.current = requestAnimationFrame(tick);
    return () => { if (thumbsRafRef.current) cancelAnimationFrame(thumbsRafRef.current); };
  }, [gesture, gestureAction, stopThumbsArc]);

  useEffect(() => {
    if (!gestureAction) return;
    const t = setTimeout(() => {
      if (gestureAction === "save") handleSaveRef.current();
      else onRetakeRef.current();
    }, 800);
    return () => clearTimeout(t);
  }, [gestureAction]);

  function handleSave() {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `gesture-photo-${Date.now()}.jpg`;
    link.click();
    onSave();
  }

  return (
    <div className="w-full h-full relative bg-black animate-fade-in">
      {/* Hidden camera stream for gesture detection */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className="absolute opacity-0 pointer-events-none w-px h-px"
        playsInline
        muted
      />

      {/* Full-screen captured image */}
      <img
        src={imageUrl}
        alt="Captured photo"
        className="w-full h-full object-cover"
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Success overlay — shown when gesture is confirmed */}
      {gestureAction && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 animate-fade-in pointer-events-none">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl ${
              gestureAction === "save"
                ? "bg-green-400/90 shadow-green-400/30"
                : "bg-white/20"
            }`}
          >
            {gestureAction === "save" ? (
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Thumbs progress arc */}
      {!gestureAction && thumbsProgress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={ARC_R} fill="none" stroke="rgba(26,101,123,0.20)" strokeWidth="5" />
              <circle
                cx="50" cy="50" r={ARC_R}
                fill="none"
                stroke="#1A657B"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ARC_CIRC}
                strokeDashoffset={ARC_CIRC * (1 - thumbsProgress)}
                style={{ transition: "stroke-dashoffset 0.05s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {gesture === "thumbs_up"
                ? <ThumbsUpIcon className="w-8 h-9 text-white/80" />
                : <ThumbsDownIcon className="w-8 h-9 text-white/80" />
              }
            </div>
          </div>
        </div>
      )}

      {/* Gesture hint */}
      {!gestureAction && thumbsProgress === 0 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
          <div className="glass rounded-pill px-5 py-2.5 flex items-center gap-4 text-xs tracking-wide">
            <div
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                gesture === "thumbs_down" ? "text-white" : "text-white/40"
              }`}
            >
              <ThumbsDownIcon className="w-4 h-5" />
              Retake
            </div>
            <span className="text-white/20">·</span>
            <div
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                gesture === "thumbs_up" ? "text-white" : "text-white/40"
              }`}
            >
              <ThumbsUpIcon className="w-4 h-5" />
              Save
            </div>
          </div>
        </div>
      )}

      {/* Action bar — manual fallback buttons */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8">
        <button
          onClick={onRetake}
          className="btn"
          style={{ background: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.20)", padding: "12px 28px" }}
        >
          Retake
        </button>

        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ padding: "12px 28px" }}
        >
          Save
        </button>
      </div>

      {/* Top label */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 glass rounded-pill px-5 py-2">
        <p className="text-white/70 text-xs tracking-widest uppercase">
          Photo captured
        </p>
      </div>

      {/* Watermark logo (no filter only) */}
      {activeFilter === "no_filter" && (
        <img
          src={logo}
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: "clamp(16px, 3vw, 32px)",
            right: "clamp(16px, 3vw, 32px)",
            width: "clamp(160px, 18vw, 260px)",
            opacity: 0.75,
          }}
        />
      )}
    </div>
  );
}
