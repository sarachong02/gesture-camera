# Gesture Camera Booth

A gesture-controlled photo booth app built with React, TypeScript, and MediaPipe. Users control the camera entirely through hand gestures — no buttons required.

## How It Works

1. **Show an open palm** to calibrate. Move your hand to pan and tilt the camera frame.
2. **Make a fist** to trigger the 5-second countdown.
3. **Pose freely** while the countdown runs — gesture detection is suspended so your hands won't interfere.
4. The photo is taken automatically when the countdown reaches zero.

## Gestures

| Gesture | Effect |
|---|---|
| Open palm | Calibrate / pan and tilt the frame |
| Closed fist | Start the countdown |

## Tech Stack

- React + TypeScript (Vite)
- MediaPipe Hand Landmarker (via `@mediapipe/tasks-vision`)
- Tailwind CSS
- Web Audio API (countdown beeps)

## Running Locally

```bash
npm install
npm run dev
```

---

## Changelog

### 2026-05-19

- **Countdown gesture lock** — all gesture detection is suspended the moment the fist triggers the countdown. No gesture (including open palm) can interfere with the shot once the countdown starts.
- **Hand skeleton hidden during countdown** — the amber hand-tracking overlay is removed from the screen as soon as the countdown begins.
- **Countdown UI redesign** — removed the circular progress arc; countdown number is now 210px bold Inter.
- **Countdown audio** — tick beep changed to 440 Hz, 1-second duration per count.
- **Fist no longer shows yellow overlay** — the amber skeleton nodes no longer appear when the fist gesture is held before triggering the countdown.
- **Gesture feedback updated** — bottom hint reads "Pose for the picture" during the countdown instead of "Open palm to cancel."

### Initial Release — 2026-05-19

- Gesture-controlled camera booth with MediaPipe hand tracking.
- Open palm calibrates the camera and enables pan/tilt by moving the hand.
- Closed fist triggers a 5-second countdown with audio beeps and a shutter sound.
- Choice of digital-only or digital + physical ($2) photo modes.
- Hand skeleton overlay (green when calibrated, amber during countdown) with glow effects.
- Rule-of-thirds grid shown when calibrated.
- Capture, retake, and save flow after the photo is taken.
