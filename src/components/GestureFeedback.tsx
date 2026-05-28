import type { DetectedGesture, GestureState } from "../types";

interface Props {
  gesture: DetectedGesture;
  gestureState: GestureState;
  peaceSignProgress: number;
}

export default function GestureFeedback({ gesture, gestureState, peaceSignProgress }: Props) {
  function getLabel(): string {
    if (gestureState === "waiting") {
      if (gesture === "open_palm") return "Calibration Complete";
      return "Show open palm to begin";
    }
    if (gestureState === "calibrated") {
      if (gesture === "peace_sign") {
        if (peaceSignProgress >= 1) return "Starting countdown…";
        const secs = Math.ceil(3 * (1 - peaceSignProgress));
        return `Hold peace sign · ${secs}s`;
      }
      if (gesture === "open_palm") return "Move hand to frame";
      return "Hold peace sign to start";
    }
    if (gestureState === "countdown") {
      return "Pose for the picture";
    }
    return "";
  }

  function getDotColor(): string {
    if (gesture === "open_palm")  return "bg-green-400";
    if (gesture === "peace_sign") return "bg-green-400";
    return "bg-white/25";
  }

  const label = getLabel();
  if (!label) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 glass rounded-pill px-5 py-2.5 animate-fade-in">
      <span className={`w-2 h-2 rounded-full ${getDotColor()} transition-colors duration-300`} />
      <span className="text-white/85 text-xs tracking-wide">{label}</span>
    </div>
  );
}
