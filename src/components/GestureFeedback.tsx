import type { DetectedGesture, GestureState } from "../types";

interface Props {
  gesture: DetectedGesture;
  gestureState: GestureState;
}

export default function GestureFeedback({ gesture, gestureState }: Props) {
  function getLabel(): string {
    if (gestureState === "waiting") {
      if (gesture === "open_palm") return "Calibration Complete";
      return "Show open palm to begin";
    }
    if (gestureState === "calibrated") {
      if (gesture === "closed_fist") return "Make a fist · countdown starts";
      if (gesture === "open_palm")   return "Move hand to frame";
      return "No hand detected";
    }
    if (gestureState === "countdown") {
      return "Open palm to cancel";
    }
    return "";
  }

  function getDotColor(): string {
    if (gesture === "open_palm")   return "bg-green-400";
    if (gesture === "closed_fist") return "bg-amber-400";
    return "bg-white/20";
  }

  const label = getLabel();
  if (!label) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 glass-dark rounded-full px-5 py-2.5 animate-fade-in">
      <span className={`w-2 h-2 rounded-full ${getDotColor()} transition-colors duration-300`} />
      <span className="text-white/70 text-xs tracking-wide">{label}</span>
    </div>
  );
}
