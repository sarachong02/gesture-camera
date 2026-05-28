import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useCamera } from "../hooks/useCamera";
import type { FilterId } from "../types";
import { FILTERS } from "../types";
import { FILTER_OVERLAYS } from "../filterOverlays";

interface Props {
  activeFilter: FilterId;
  onFilterChange: (filter: FilterId) => void;
  onConfirm: (filter: FilterId) => void;
}

const FILTER_EMOJI: Record<FilterId, string> = {
  no_filter: "—",
  jellyfish: "🪼",
  orca: "🐋",
  harbor_seal: "🦭",
  salmon: "🐟",
};

export default function FilterScreen({ activeFilter, onFilterChange, onConfirm }: Props) {
  const { videoRef, isReady } = useCamera();
  const overlayUrl = FILTER_OVERLAYS[activeFilter];

  const [jellyfishUnlocked, setJellyfishUnlocked] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrPhase, setQrPhase] = useState<"scanning" | "detected">("scanning");
  const qrVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!qrModalOpen || !qrVideoRef.current || !videoRef.current) return;
    const stream = videoRef.current.srcObject as MediaStream | null;
    if (stream) {
      qrVideoRef.current.srcObject = stream;
      qrVideoRef.current.play().catch(() => {});
    }
  }, [qrModalOpen, videoRef]);

  useEffect(() => {
    if (!qrModalOpen) return;
    setQrPhase("scanning");
    const t1 = setTimeout(() => setQrPhase("detected"), 2000);
    const t2 = setTimeout(() => {
      setJellyfishUnlocked(true);
      setQrModalOpen(false);
      onFilterChange("jellyfish");
    }, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [qrModalOpen, onFilterChange]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Live camera preview */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        playsInline
        autoPlay
        muted
      />

      {/* Selected border overlay */}
      {overlayUrl && (
        <img
          src={overlayUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          aria-hidden
        />
      )}

      {/* Camera loading */}
      {!isReady && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Top label */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 glass rounded-full px-5 py-2 pointer-events-none">
        <p className="text-white/80 text-xs tracking-[0.25em] uppercase">Choose your border</p>
      </div>

      {/* QR scan modal */}
      {qrModalOpen && (
        <div className="absolute inset-0 bg-[rgba(19,78,94,0.82)] flex flex-col items-center justify-center z-50" style={{ backdropFilter: "blur(8px)" }}>
          <style>{`@keyframes qr-scan{0%,100%{transform:translateY(0)}50%{transform:translateY(200px)}}`}</style>

          <p className="text-white/60 text-xs tracking-[0.2em] uppercase mb-5">
            Hold a QR code up to the camera
          </p>

          {/* Viewfinder */}
          <div className={`relative w-56 h-56 overflow-hidden rounded-xl mb-6 transition-all duration-300 ${
            qrPhase === "detected"
              ? "ring-2 ring-green-400 shadow-[0_0_24px_rgba(74,222,128,0.55)]"
              : "ring-1 ring-primary/40"
          }`}>
            <video
              ref={qrVideoRef}
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              playsInline
              muted
            />

            {qrPhase === "scanning" && (
              <div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none"
                style={{ animation: "qr-scan 2s ease-in-out infinite" }}
              />
            )}

            {/* Corner brackets — teal */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-light/80 pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-light/80 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-light/80 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-light/80 pointer-events-none" />

            {/* Success overlay */}
            {qrPhase === "detected" && (
              <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-green-400/40 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-9 h-9 text-green-200" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <p className={`text-sm tracking-[0.2em] uppercase transition-colors duration-300 ${
            qrPhase === "detected" ? "text-green-400" : "text-white/80"
          }`}>
            {qrPhase === "scanning" ? "Scanning QR Code…" : "QR Code Detected"}
          </p>

          {qrPhase === "scanning" && (
            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-10 text-white/40 text-xs tracking-widest uppercase hover:text-white/60 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Bottom filter bar */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pt-8 pb-8 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
        <div className="flex items-end justify-between gap-4">

          {/* Filter option cards */}
          <div className="flex gap-3">
            {FILTERS.flatMap((filter, idx) => {
              const filterOverlay = FILTER_OVERLAYS[filter.id];
              const hasOverlay    = !!filterOverlay;
              const isNoFilter    = filter.id === "no_filter";
              const isEnabled     = hasOverlay || isNoFilter;
              const isActive      = activeFilter === filter.id;

              const card = (
                <button
                  key={filter.id}
                  onClick={() => { if (isEnabled) onFilterChange(filter.id); }}
                  disabled={!isEnabled}
                  className={`relative flex flex-col items-center gap-2 px-3 pt-2.5 pb-3 rounded-2xl min-w-[80px] transition-all duration-200 select-none
                    ${isActive
                      ? "bg-primary/25 border border-primary-light/60 text-white"
                      : isEnabled
                        ? "bg-black/50 border border-white/12 text-white/55 active:bg-primary/10"
                        : "bg-black/30 border border-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  <div className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-black/30">
                    {hasOverlay ? (
                      <img src={filterOverlay} alt="" className="w-full h-full object-cover" />
                    ) : isNoFilter ? (
                      <svg viewBox="0 0 56 40" className="w-full h-full opacity-30" fill="none">
                        <line x1="8" y1="6" x2="48" y2="34" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="48" y1="6" x2="8" y2="34" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <span className="text-2xl">{FILTER_EMOJI[filter.id]}</span>
                    )}
                  </div>

                  <span className="text-xs tracking-wide text-center leading-tight px-1">
                    {filter.label}
                  </span>

                  {!isEnabled && (
                    <span className="absolute top-1.5 right-2 text-[9px] tracking-wider text-white/25 uppercase">
                      Soon
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-light/80" />
                  )}
                </button>
              );

              if (idx !== 0) return [card];

              const jellyfishOverlay = FILTER_OVERLAYS["jellyfish"];
              const isJellyfishActive = activeFilter === "jellyfish";
              const qrBtn = (
                <button
                  key="qr_scan"
                  onClick={() => {
                    if (jellyfishUnlocked) {
                      onFilterChange("jellyfish");
                    } else {
                      setQrModalOpen(true);
                    }
                  }}
                  className={`relative flex flex-col items-center gap-2 px-3 pt-2.5 pb-3 rounded-2xl min-w-[80px] transition-all duration-200 select-none
                    ${isJellyfishActive
                      ? "bg-primary/25 border border-primary-light/60 text-white"
                      : "bg-black/50 border border-white/12 text-white/55 active:bg-primary/10"
                    }
                  `}
                >
                  <div className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-black/30">
                    {jellyfishUnlocked && jellyfishOverlay ? (
                      <img src={jellyfishOverlay} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 40 40" className="w-9 h-9 opacity-60" fill="white">
                        <rect x="3" y="3" width="13" height="13" rx="1.5" fill="none" stroke="white" strokeWidth="2"/>
                        <rect x="7" y="7" width="5" height="5" fill="white"/>
                        <rect x="24" y="3" width="13" height="13" rx="1.5" fill="none" stroke="white" strokeWidth="2"/>
                        <rect x="28" y="7" width="5" height="5" fill="white"/>
                        <rect x="3" y="24" width="13" height="13" rx="1.5" fill="none" stroke="white" strokeWidth="2"/>
                        <rect x="7" y="28" width="5" height="5" fill="white"/>
                        <rect x="24" y="24" width="5" height="5" fill="white"/>
                        <rect x="31" y="24" width="5" height="5" fill="white"/>
                        <rect x="24" y="31" width="5" height="5" fill="white"/>
                        <rect x="31" y="31" width="5" height="5" fill="white"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs tracking-wide text-center leading-tight px-1">
                    Custom
                  </span>
                  {isJellyfishActive && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-light/80" />
                  )}
                </button>
              );

              return [card, qrBtn];
            })}
          </div>

          {/* Continue */}
          <button
            onClick={() => onConfirm(activeFilter)}
            className="btn btn-primary flex-shrink-0"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
