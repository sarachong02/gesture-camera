export type AppScreen = "start" | "choice" | "cost" | "camera" | "capture" | "thankyou";

export type PhotoType = "digital" | "physical";

export type GestureState =
  | "waiting"      // waiting for open palm to calibrate
  | "calibrated"   // open palm detected, calibration locked
  | "countdown"    // closed fist triggered 5-second countdown
  | "captured";    // photo taken

export type DetectedGesture = "none" | "open_palm" | "closed_fist";

export interface PalmPosition {
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized
}

export interface CalibrationRef {
  x: number;
  y: number;
}
