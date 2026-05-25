# Gesture Camera Booth

A gesture-controlled photo booth app built with React, TypeScript, and MediaPipe. Users control the camera entirely through hand gestures — no buttons required.

## How It Works

1. **Show an open palm** to calibrate. Move your hand to pan and tilt the camera frame.
2. **Hold a peace sign for 3 seconds** to trigger the 5-second countdown. A progress arc shows how long the sign has been held.
3. **Pose freely** while the countdown runs — only a deliberate open palm can cancel it.
4. The photo is taken automatically when the countdown reaches zero.

## Gestures

| Gesture | Effect |
|---|---|
| Open palm | Calibrate / pan and tilt the frame |
| Peace sign (held 3 s) | Start the countdown |
| Open palm during countdown | Cancel countdown, return to calibrated |

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

## Handoff — 2026-05-24

### What was worked on

Three separate sessions refined the gesture trigger, countdown robustness, and hand-tracking identity.

---

#### Session 1 — Replace fist trigger with peace-sign hold

**Goal:** Make the countdown trigger feel intentional. A fist is too easy to accidentally hold; a sustained peace sign is a clear deliberate act.

**Changes:**

- Replaced `detectFist` with `detectPeaceSign` (index + middle above PIP, ring + pinky below PIP). Detectors are mutually exclusive with `detectOpenPalm`.
- `detectOpenPalm` tightened from MCP-level to PIP-level threshold — requires fingers clearly fully extended.
- `peaceSignStartRef` tracks a `performance.now()` timestamp; resets immediately on any non-peace-sign frame. `peaceSignProgress` (0–1) is exposed to the UI.
- Countdown only triggers in `CameraScreen`'s state machine when `gesture === "peace_sign" && peaceSignProgress >= 1`.
- A centered SVG progress arc appears while the peace sign is held, counting down `3s → 2s → 1s`.
- `GestureFeedback` bottom hint updated: shows live hold-time ("Hold peace sign · 2s") in calibrated state; "Pose for the picture" during countdown.

**Key files changed:**
- `src/types.ts` — `DetectedGesture` changed from `"closed_fist"` to `"peace_sign"`.
- `src/hooks/useGestureDetection.ts` — `detectPeaceSign` added; `detectFist` removed; `peaceSignProgress` state and timer logic added; `gestureState` passed in as param so the hook internally restricts to `detectOpenPalm`-only during countdown.
- `src/screens/CameraScreen.tsx` — state machine updated; peace sign progress arc added.
- `src/components/GestureFeedback.tsx` — labels updated.

---

#### Session 2 — Fix peace-sign → countdown transition and single-user tracking

**Goal 1:** Countdown must start the instant the 3-second hold completes, with the hand still visible.

**Root cause:** When `peaceSignProgress` hits 1 and state flips to `"countdown"`, the very next rAF frame runs `detectOpenPalm` on a hand still posed as a peace sign. If ring/pinky aren't deeply curled at that exact frame, `detectOpenPalm` fires and cancels the countdown before the user perceives it starting.

**Fix:** `countdownStartRef` records a `performance.now()` timestamp when the countdown state begins. Open-palm cancel is suppressed for the first `COUNTDOWN_CANCEL_DELAY_MS` (1500 ms). This grace window covers the natural hand-pose transition without blocking legitimate cancellation.

**Goal 2:** Calibration works equally well with left or right hand.

**Root cause:** MediaPipe reports handedness from the camera's perspective on the raw unmirrored frame — opposite to what the user sees on the mirrored display. The label also flips inconsistently between detection and tracking modes. The previous handedness lock was silently dropping the user's own landmarks.

**Fix:** Removed handedness-based filtering entirely. `numHands` raised from 1 to 2.

**Goal 3:** One user controls the booth even when multiple people are in frame.

**Implementation:** `lockedPalmRef` stores the palm center of the last-selected hand. Each frame, when multiple hands are returned by MediaPipe, the hook picks whichever hand is closest (squared Euclidean distance) to `lockedPalmRef` — following the calibrating user's hand and ignoring hands that appear at a different location. `lockedPalmRef` updates every frame so the user can move freely; resets to `null` only on retake/app reset.

**Key files changed:**
- `src/hooks/useGestureDetection.ts` — `countdownStartRef` + cooldown; `lockedHandednessRef` removed; `lockedPalmRef` + `palmDistSq` added; `numHands: 2`.

---

#### Session 3 — Fix countdown pausing on hand presence

**Root cause (two parts):**

1. `setPalmPosition(smoothPosition(rawCenter))` was called on every camera frame regardless of state. `smoothPosition` always allocates a new `{x, y}` object, so `CameraScreen` re-rendered at ~60 fps during countdown whenever a hand was in frame.

2. `CountdownOverlay`'s `useEffect` listed `onComplete` in its dependency array. `handleCountdownComplete` in `CameraScreen` is a `useCallback` whose stability depends on `captureFrame` from `useCamera`. If `captureFrame` is not memoized, every 60-fps re-render produces a new `onComplete` reference → `CountdownOverlay`'s effect re-runs → `cancelAnimationFrame(raf)` + `start = null` → the 1-second tick resets every frame. Countdown appeared frozen while any hand was visible.

**Fix 1 (hook):** During countdown, `setPalmPosition` and `landmarksRef` are no longer updated — pan/tilt is inactive and the skeleton overlay is hidden, so both are unused. This eliminates the 60-fps re-render cycle.

**Fix 2 (CountdownOverlay):** `onCompleteRef` stores the latest `onComplete` prop value without being a dependency. The `useEffect` dep array is reduced to `[count]` only. The timer now restarts exactly once per second (when `count` decrements) regardless of any parent re-renders.

**Key files changed:**
- `src/hooks/useGestureDetection.ts` — `setPalmPosition` / `landmarksRef` updates moved inside the non-countdown branch.
- `src/components/CountdownOverlay.tsx` — `onCompleteRef` introduced; `onComplete` removed from `useEffect` deps.

---

### State of the codebase

The gesture state machine has three states: `waiting` → `calibrated` → `countdown`.

- **`waiting`**: Detects open palm only. First open palm sets `calibrationRef` and transitions to `calibrated`. Hand lock is cleared here (retake resets everything).
- **`calibrated`**: Open palm pans/tilts the frame. Peace sign held for 3 continuous seconds transitions to `countdown`. A progress arc is shown during the hold.
- **`countdown`**: `setPalmPosition` and landmark updates are suspended (no re-renders from hand detection). `countdownStartRef` gates open-palm cancel for the first 1500 ms. After the gate, a clearly detected open palm cancels and returns to `calibrated`. `CountdownOverlay` runs a pure rAF loop keyed only on `count`; fires `onComplete` at zero, which calls `captureFrame()` and navigates to the capture screen.

After capture the user can retake (returns to `camera` screen, resets to `waiting`) or save (goes to `thankyou` screen).

---

### Suggested next steps

- The `peaceSignProgress >= 1` trigger in the gesture state machine fires once and immediately starts the countdown; if a user accidentally holds a peace sign while framing, the 3-second hold is intentional enough that this is rarely an issue — but a visual "ready" flash on the arc completion could reinforce that the countdown has started.
- `COUNTDOWN_CANCEL_DELAY_MS` is currently 1500 ms. If open palm cancellation feels sluggish, lowering this to ~800 ms is safe as long as ring/pinky curl quickly enough in practice.
- `lockedPalmRef` uses proximity to maintain single-user tracking. If the booth is used in very crowded scenes where hands overlap spatially, raising `minHandDetectionConfidence` (currently 0.5) can reduce false detections.
- The pan/tilt calibration resets every time the user returns from a retake. Persisting `calibrationRef` across retakes (while still resetting `gestureState` to `"waiting"`) would let users re-take without re-calibrating.

---

## Changelog

### 2026-05-24

- **Peace sign trigger** — closed fist replaced with a peace sign held for 3 continuous seconds. Progress arc shows hold time; timer resets immediately if the sign breaks.
- **Open palm cancel** — open palm during countdown cancels and returns to calibrated state. A 1500 ms suppression window at countdown start prevents the peace-sign pose from false-triggering cancel.
- **Immediate countdown start** — countdown begins the instant the 3-second hold completes; hand does not need to leave frame.
- **Countdown timer decoupled from hand detection** — `setPalmPosition` updates suspended during countdown; `CountdownOverlay` timer deps reduced to `[count]` via `onCompleteRef`. Timer no longer pauses or buffers on hand presence.
- **Handedness-agnostic calibration** — handedness-based hand lock removed; works equally well with left or right hand.
- **Proximity-based single-user lock** — `numHands` raised to 2; `lockedPalmRef` tracks the calibrating user's hand by proximity. Other people's hands in frame are ignored after calibration.
- **Peace sign progress arc** — centered SVG ring shows hold progress and a live second countdown while peace sign is detected.
- **Gesture feedback updated** — calibrated state shows "Hold peace sign · Xs" with live countdown; no fist-related hints remain.

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
