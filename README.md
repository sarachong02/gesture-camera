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

## Handoff — 2026-05-19

### What was worked on

This session focused entirely on refining the gesture-to-countdown interaction and the countdown UI/audio. Here is a full account of what was discussed, what was tried, and where things landed.

#### Gesture detection during countdown

**The goal:** Once a user makes a fist, the countdown should start immediately — even with the hand still visible in frame — and nothing should interrupt it.

**What was tried (in order):**

1. **Removed open-palm cancel** — The original code cancelled the countdown if an open palm was detected during it. This was removed, but it left no way to cancel at all, which wasn't the intent.
2. **Grace-period approach (1500 ms)** — Added back open-palm cancel but ignored it for the first 1.5 seconds after the fist. This failed: after 1.5 s, any natural hand pose resembling an open palm would instantly cancel the countdown. Users experienced the countdown as never starting while their hand was in frame.
3. **Sustained open-palm debounce (1 second hold)** — Required open palm to be continuously detected for 1 full second to cancel. Still didn't resolve the user's experience.
4. **Disable all gesture detection during countdown** — `enabled: isReady && gestureState !== "countdown"` in `useGestureDetection`. This was confirmed working. The countdown starts immediately on fist, the hand can stay in frame freely, and nothing interrupts the shot.

**Final decision:** All gesture inputs — including open palm — are completely disabled the moment the fist triggers the countdown. There is no way to cancel once the countdown starts. The photo will always be taken.

**Key files changed:**
- `src/screens/CameraScreen.tsx` — `enabled` prop on `useGestureDetection` gates off during countdown; hand skeleton `visible` prop also gated off during countdown; countdown state block removed from the gesture state machine.
- `src/hooks/useGestureDetection.ts` — No changes; the `enabled` flag already stops the rAF detection loop cleanly.

#### Countdown UI

- Circular SVG progress arc removed entirely.
- Countdown number: **210px, bold, Inter**.
- Bottom label reads "Pose for the picture" during countdown.

#### Countdown audio

- Each tick: **440 Hz sine wave, 1-second exponential decay**.
- Shutter sound on zero: unchanged (brief ascending chirp).

---

### State of the codebase

The gesture state machine has three states: `waiting` → `calibrated` → `countdown`.

- **`waiting`**: No detection acting. Waiting for an open palm to calibrate.
- **`calibrated`**: Open palm pans/tilts the frame. Closed fist transitions to `countdown`.
- **`countdown`**: Gesture detection is fully off. `CountdownOverlay` runs a 5-second rAF loop, plays a tick each second, fires `onComplete` at zero which calls `captureFrame()` and transitions to the capture screen.

After capture the user can retake (returns to `camera` screen, resets to `waiting`) or save (goes to `thankyou` screen).

---

### Suggested next steps

- Consider adding a visual or audio cue right when the fist is detected (before the first tick) so users get immediate feedback that the countdown has started.
- The `detectOpenPalm` classifier is fairly broad (any pose with all four fingertips above their MCP knuckles). If users frequently trigger it accidentally during calibration, tightening the threshold or adding a confidence buffer could help.
- The pan/tilt calibration resets every time the user returns from a retake. If that feels disruptive, the calibration position could be persisted across retakes.

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
