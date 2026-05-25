import type React from "react";
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
  orca: "🐋",
  harbor_seal: "🦭",
  geoduck_clam: "🐚",
  giant_pacific_octopus: "🐙",
};

export default function FilterScreen({ activeFilter, onFilterChange, onConfirm }: Props) {
  const { videoRef, isReady } = useCamera();
  const overlayUrl = FILTER_OVERLAYS[activeFilter];

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Live camera preview */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        playsInline
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
          <div className="w-8 h-8 border border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}

      {/* Top label */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 glass-dark rounded-full px-5 py-2 pointer-events-none">
        <p className="text-white/60 text-xs tracking-[0.25em] uppercase">Choose your border</p>
      </div>

      {/* Bottom filter bar */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pt-8 pb-8 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
        <div className="flex items-end justify-between gap-4">

          {/* Filter option cards */}
          <div className="flex gap-3">
            {FILTERS.map((filter) => {
              const filterOverlay = FILTER_OVERLAYS[filter.id];
              const hasOverlay = !!filterOverlay;
              const isActive = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  onClick={() => { if (hasOverlay) onFilterChange(filter.id); }}
                  disabled={!hasOverlay}
                  className={`relative flex flex-col items-center gap-2 px-3 pt-2.5 pb-3 rounded-2xl min-w-[80px] transition-all duration-200 select-none
                    ${isActive
                      ? "bg-white/20 border border-white/60 text-white"
                      : hasOverlay
                        ? "bg-black/50 border border-white/15 text-white/55 active:bg-white/10"
                        : "bg-black/30 border border-white/5 text-white/20 cursor-not-allowed"
                    }
                  `}
                >
                  {/* Border thumbnail or emoji */}
                  <div className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-black/30">
                    {hasOverlay ? (
                      <img
                        src={filterOverlay}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{FILTER_EMOJI[filter.id]}</span>
                    )}
                  </div>

                  <span className="text-xs tracking-wide text-center leading-tight px-1">
                    {filter.label}
                  </span>

                  {!hasOverlay && (
                    <span className="absolute top-1.5 right-2 text-[9px] tracking-wider text-white/25 uppercase">
                      Soon
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Continue */}
          <button
            onClick={() => onConfirm(activeFilter)}
            className="flex-shrink-0 px-8 py-4 rounded-full border border-white/30 bg-white/10 text-white text-sm tracking-widest uppercase active:bg-white/20 transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
