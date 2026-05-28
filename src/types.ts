export type AppScreen = "start" | "phone" | "filter" | "tutorial" | "camera_gate" | "camera" | "capture" | "consent" | "thankyou";

export type FilterId = "no_filter" | "jellyfish" | "orca" | "harbor_seal" | "salmon";

export interface FilterOption {
  id: FilterId;
  label: string;
}

export const FILTERS: FilterOption[] = [
  { id: "no_filter", label: "No Filter" },
  { id: "orca", label: "Orca" },
  { id: "harbor_seal", label: "Harbor Seal" },
  { id: "salmon", label: "Salmon" },
];

export type GestureState =
  | "waiting"      // waiting for open palm to calibrate
  | "calibrated"   // open palm detected, calibration locked
  | "countdown"    // peace sign held 3s triggered countdown
  | "captured";    // photo taken

export type DetectedGesture = "none" | "open_palm" | "peace_sign" | "thumbs_up" | "thumbs_down";

export interface PalmPosition {
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized
}

export interface CalibrationRef {
  x: number;
  y: number;
}
