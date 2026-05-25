export type AppScreen = "start" | "phone" | "filter" | "tutorial" | "camera" | "capture" | "thankyou";

export type FilterId = "orca" | "harbor_seal" | "geoduck_clam" | "giant_pacific_octopus";

export interface FilterOption {
  id: FilterId;
  label: string;
}

export const FILTERS: FilterOption[] = [
  { id: "orca", label: "Orca" },
  { id: "harbor_seal", label: "Harbor Seal" },
  { id: "geoduck_clam", label: "Geoduck Clam" },
  { id: "giant_pacific_octopus", label: "Giant Pacific Octopus" },
];

export type GestureState =
  | "waiting"      // waiting for open palm to calibrate
  | "calibrated"   // open palm detected, calibration locked
  | "countdown"    // peace sign held 3s triggered countdown
  | "captured";    // photo taken

export type DetectedGesture = "none" | "open_palm" | "peace_sign";

export interface PalmPosition {
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized
}

export interface CalibrationRef {
  x: number;
  y: number;
}
