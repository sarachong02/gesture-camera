import { useState, useEffect, useRef } from "react";
import type React from "react";
import { ThumbsUpIcon, ThumbsDownIcon } from "../components/GestureIcons";
import { useCamera } from "../hooks/useCamera";
import { useGestureDetection } from "../hooks/useGestureDetection";

interface Props {
  imageUrl: string;
  onRetake: () => void;
  onSave: () => void;
}

export default function CaptureScreen({ imageUrl, onRetake, onSave }: Props) {
  const [gestureAction, setGestureAction] = useState<"save" | "retake" | null>(null);

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

  useEffect(() => {
    if (gestureAction) return;
    if (gesture !== "thumbs_up" && gesture !== "thumbs_down") return;
    const action = gesture === "thumbs_up" ? "save" : "retake";
    const t = setTimeout(() => setGestureAction(action), 500);
    return () => clearTimeout(t);
  }, [gesture, gestureAction]);

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

      {/* Gesture hint */}
      {!gestureAction && (
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
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={onRetake}
          className="glass-dark px-8 py-3 rounded-pill text-white/70 text-2xl tracking-widest uppercase hover:bg-white/10 transition-all duration-200"
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
    </div>
  );
}
