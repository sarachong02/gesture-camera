import { useEffect, useRef, useState } from "react";

const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.0;

interface Props {
  zoomLevel: number;
  isPinching: boolean;
}

export default function ZoomIndicator({ zoomLevel, isPinching }: Props) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAtDefault = Math.abs(zoomLevel - 1.0) < 0.05;

  useEffect(() => {
    if (isPinching || !isAtDefault) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setVisible(true);
    } else {
      // Linger for 1.5 s after the user stops pinching before fading out
      hideTimerRef.current = setTimeout(() => setVisible(false), 1500);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPinching, isAtDefault]);

  // Fill fraction of the vertical bar: 0 = min zoom, 1 = max zoom
  const fill = Math.max(0, Math.min(1, (zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)));

  return (
    <div
      className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Max label */}
      <span className="text-white/20 text-[10px] tracking-wider">{MAX_ZOOM}×</span>

      {/* Vertical track */}
      <div className="relative w-[3px] h-28 rounded-full bg-white/10 overflow-hidden">
        {/* Filled portion — grows from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{
            height: `${fill * 100}%`,
            background: isPinching
              ? "rgba(74,222,128,0.85)"   // green while actively pinching
              : "rgba(255,255,255,0.45)", // white when settled
            transition: "height 0.08s linear, background 0.3s ease",
          }}
        />
        {/* Thumb knob */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white/40"
          style={{
            bottom: `calc(${fill * 100}% - 5px)`,
            background: isPinching ? "#4ade80" : "white",
            transition: "bottom 0.08s linear, background 0.3s ease",
            boxShadow: isPinching
              ? "0 0 8px rgba(74,222,128,0.7)"
              : "0 0 6px rgba(255,255,255,0.3)",
          }}
        />
      </div>

      {/* Min label */}
      <span className="text-white/20 text-[10px] tracking-wider">{MIN_ZOOM}×</span>

      {/* Live readout */}
      <div className="glass-dark rounded-full px-2.5 py-1 mt-1">
        <span
          className="text-xs tabular-nums font-medium"
          style={{
            color: isPinching ? "#4ade80" : "rgba(255,255,255,0.6)",
            transition: "color 0.3s ease",
          }}
        >
          {zoomLevel.toFixed(1)}×
        </span>
      </div>
    </div>
  );
}
