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

## Handoff — 2026-05-24 (Session 2)

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

---

## Handoff — 2026-05-24 (Session 3)

### What was worked on

Reworked the onboarding start flow: removed the photo-type selection screen, added a phone number step, a live-preview filter selection step with real border images, and a step-by-step tutorial screen.

---

#### Change 1 — Remove Digital / Digital + Physical selection

**Removed** the choice screen and cost screen entirely. `PhotoType` and the `"choice"` / `"cost"` app states are gone. `ChoiceScreen.tsx` and `CostScreen.tsx` deleted.

---

#### Change 2 — Phone number screen

Added `PhoneScreen` as the second step (after Start).

- Numeric input auto-formats to `(xxx) xxx-xxxx`; Continue is disabled until 10 digits are entered.
- Privacy copy: *"Your photo will be texted to this number and deleted immediately after the session."*
- Phone number stored in `App` state (`_phoneNumber`). No SMS backend yet.

**Key files:**
- `src/screens/PhoneScreen.tsx` — new
- `src/App.tsx` — `_phoneNumber` state; routes Start → phone

---

#### Change 3 — Filter selection with live camera preview

Added `FilterScreen` as the third step (after phone).

- Full-screen live camera preview starts immediately when the screen mounts (using `useCamera`).
- Selecting a filter overlays the corresponding border image on the live feed in real time so users can frame themselves before choosing.
- Touch-friendly filter cards at the bottom; thumbnail of the border image is shown in each card.
- Orca and Harbor Seal have real border images. Geoduck Clam and Giant Pacific Octopus are placeholders (disabled, labelled "Soon").
- Selected border **persists into the captured photo** — `CameraScreen` renders the overlay during the live view, and `compositeWithOverlay` canvas-composites it onto the raw frame at capture time.

**`images/` folder** — border PNGs live here (not in `public/`); Vite imports them as bundled asset URLs:
- `orca_background.png` → mapped to filter id `"orca"`
- `seal_background.png` → mapped to filter id `"harbor_seal"`

**Key files:**
- `src/screens/FilterScreen.tsx` — new (replaces static picker)
- `src/filterOverlays.ts` — new; imports PNGs, exports `FILTER_OVERLAYS` map and `compositeWithOverlay`
- `src/vite-env.d.ts` — new; adds `/// <reference types="vite/client" />` so TypeScript understands PNG imports
- `src/screens/CameraScreen.tsx` — `photoType` prop replaced with `activeFilter: FilterId`; border overlay `<img>` added (fixed, outside pan/tilt div); `handleCountdownComplete` made async to composite overlay before calling `onCapture`
- `src/types.ts` — `PhotoType` removed; `FilterId`, `FilterOption`, `FILTERS` constant added

---

#### Change 4 — Tutorial screen

Added `TutorialScreen` between filter selection and the camera (step 4 of 5 in the start flow).

- Four steps shown one at a time (progressive disclosure):
  1. **Calibrate** — open palm illustration + explanation
  2. **Start Countdown** — peace sign illustration + explanation
  3. **During Countdown** — countdown numbers; explains normal poses won't cancel
  4. **Cancel Countdown** — open palm again; explains deliberate cancel gesture
- Pill-shaped step dots (active dot widens to a pill); Back / Next navigation; "Let's Go" on the final step.
- **Skip Tutorial** button (top right) bypasses all steps and goes directly to the camera.
- Gesture illustrations are inline SVGs styled to match the app's white-on-dark aesthetic, reusing the circular ring container pattern from the Start screen.

**Key files:**
- `src/screens/TutorialScreen.tsx` — new
- `src/App.tsx` — `"tutorial"` added to `AppScreen`; filter confirm now routes → tutorial → camera
- `src/types.ts` — `"tutorial"` added to `AppScreen`

---

### Updated start flow

```
Start → Phone number → Filter selection → Tutorial → Camera → Capture → Thank you
```

---

### Suggested next steps

- The `peaceSignProgress >= 1` trigger in the gesture state machine fires once and immediately starts the countdown; if a user accidentally holds a peace sign while framing, the 3-second hold is intentional enough that this is rarely an issue — but a visual "ready" flash on the arc completion could reinforce that the countdown has started.
- `COUNTDOWN_CANCEL_DELAY_MS` is currently 1500 ms. If open palm cancellation feels sluggish, lowering this to ~800 ms is safe as long as ring/pinky curl quickly enough in practice.
- `lockedPalmRef` uses proximity to maintain single-user tracking. If the booth is used in very crowded scenes where hands overlap spatially, raising `minHandDetectionConfidence` (currently 0.5) can reduce false detections.
- The pan/tilt calibration resets every time the user returns from a retake. Persisting `calibrationRef` across retakes (while still resetting `gestureState` to `"waiting"`) would let users re-take without re-calibrating.

---

## Handoff — 2026-05-25 (Session 4)

### What was worked on

Three improvements to the onboarding flow: a default "No Filter" option, MediaPipe-style hand skeleton illustrations in the tutorial, and a thumbs-up gesture gate between the tutorial and the camera.

---

#### Change 1 — Default "No Filter" option

Added `"no_filter"` as the first and default filter choice.

- `FilterId` type now includes `"no_filter"`.
- `FILTERS` constant starts with `{ id: "no_filter", label: "No Filter" }`.
- App default `activeFilter` changed from `"orca"` to `"no_filter"`.
- `FilterScreen` treats `"no_filter"` as always-enabled (alongside filters that have real overlay images). Its thumbnail shows a small ×-pattern SVG to communicate "no border". The "Soon" badge is suppressed for it.
- `CameraScreen` already handled missing overlays via a conditional render — no changes needed there.

**Key files changed:**
- `src/types.ts` — `"no_filter"` added to `FilterId`; `FILTERS` prepended with No Filter entry
- `src/App.tsx` — default `activeFilter` changed to `"no_filter"`
- `src/screens/FilterScreen.tsx` — `isEnabled` logic updated; No Filter thumbnail added

---

#### Change 2 — MediaPipe-style gesture illustrations in tutorial

Replaced the filled-rectangle SVG hand icons with proper landmark skeleton drawings that match the live `HandOverlay` style.

- New shared component `GestureIcons.tsx` defines 21 landmark positions per gesture and renders them using the same MediaPipe connection topology as `HandOverlay.tsx`: connection lines (white, 1.5 px, rounded caps) and joint circles (larger at fingertips and MCPs).
- Three icons: **OpenPalmIcon** (all fingers extended), **PeaceSignIcon** (index + middle extended, ring + pinky curled), **ThumbsUpIcon** (thumb extended upward, four fingers curled into fist).
- `TutorialScreen` imports from `GestureIcons` and adds a **fifth step** — "Start Camera" — that shows the `ThumbsUpIcon` and explains the thumbs-up camera gate before the user reaches it.

**Key files changed:**
- `src/components/GestureIcons.tsx` — new; exports `OpenPalmIcon`, `PeaceSignIcon`, `ThumbsUpIcon`
- `src/screens/TutorialScreen.tsx` — imports skeleton icons; adds step 5 (thumbs-up/Start Camera)

---

#### Change 3 — Thumbs-up camera start gate

After the user taps "Let's Go" on the final tutorial step, instead of navigating directly to the camera they land on a gate screen that requires a thumbs-up gesture to proceed. Skipping the tutorial still goes directly to the camera.

**Gate screen (`CameraGateScreen`):**
- Shows the `ThumbsUpIcon` illustration inside the same double-ring container used throughout onboarding.
- A circular SVG progress arc fills as the thumbs-up is held; navigates to the camera when it completes (~800 ms hold).
- Accessible fallback: a **"Start Camera"** button that navigates immediately without gesture detection.
- An offscreen (1 px × 1 px, opacity 0) video element feeds MediaPipe for detection without any visible camera preview.

**Gesture detection (`useThumbsUpDetection`):**
- Separate, minimal hook — does not touch `useGestureDetection` or the camera-screen state machine.
- Detection criterion: `lm[4].y < lm[2].y` (thumb tip clearly above MCP) AND all four fingertip Y-values exceed their PIP Y-values (fingers curled). Robust against open palm, peace sign, and closed fist.
- Fires `onDetected` exactly once after 800 ms of continuous hold via a `firedRef` guard.

**Routing:**
- `"camera_gate"` added to `AppScreen`.
- `TutorialScreen.onComplete` → `"camera_gate"` (was `"camera"`).
- `TutorialScreen.onSkip` → `"camera"` (unchanged — skip bypasses the gate).
- Thumbs-up gesture is **only** used in `useThumbsUpDetection`; the main camera-screen state machine is untouched.

**Key files:**
- `src/screens/CameraGateScreen.tsx` — new
- `src/hooks/useThumbsUpDetection.ts` — new
- `src/types.ts` — `"camera_gate"` added to `AppScreen`
- `src/App.tsx` — `"camera_gate"` screen wired; `CameraGateScreen` imported

---

### Updated start flow

```
Start → Phone number → Filter selection → Tutorial → Camera gate (thumbs up) → Camera → Capture → Thank you
                                                    ↑ Skip Tutorial bypasses gate ──────────────────┘
```

---

### Suggested next steps

- The thumbs-up hold threshold is 800 ms. If it feels too slow in noisy lighting, lowering to ~500 ms should still feel intentional.
- `CameraGateScreen` starts a fresh MediaPipe instance on mount. If load time is noticeable on the device, the landmarker could be initialized during the tutorial steps (while the user is reading) so it's ready by the time they tap "Let's Go".
- The gate screen has no camera preview — users can't see themselves while forming the thumbs-up. Adding a small mirrored preview (similar to `FilterScreen`) could help if users struggle with gesture recognition in practice.
- The No Filter option has a placeholder × thumbnail. A real "clean frame" preview image could be added to `images/` and mapped in `filterOverlays.ts` to make the picker feel visually consistent.

---

## Changelog

### 2026-05-25 (Session 4)

- **"No Filter" default** — added as first filter option; app now defaults to no border overlay. `FilterId` type updated; thumbnail shows a ×-pattern indicator.
- **MediaPipe-style gesture icons** — tutorial hand illustrations replaced with proper 21-landmark skeleton drawings (connection lines + joint circles) matching the live `HandOverlay` rendering style. Three icons: open palm, peace sign, thumbs up.
- **Tutorial fifth step** — "Start Camera" step added to tutorial showing the thumbs-up icon and explaining the camera gate before the user encounters it.
- **Thumbs-up camera gate** — new `CameraGateScreen` inserted between tutorial and camera; requires an 800 ms thumbs-up hold (or fallback "Start Camera" button) to proceed. "Skip Tutorial" bypasses the gate. Detection lives in a dedicated `useThumbsUpDetection` hook; main camera state machine unchanged.

### 2026-05-24 (Session 3)

- **Removed photo-type selection** — Digital / Digital + Physical choice screen eliminated. `ChoiceScreen`, `CostScreen`, and `PhotoType` are gone.
- **Phone number step** — new second screen; auto-formats input, validates 10 digits, stores number in app state for future SMS integration.
- **Filter selection with live preview** — new third screen; camera starts immediately so users can frame themselves while selecting a border. Orca and Harbor Seal have real PNG overlays; others are placeholders.
- **Border overlay in final photo** — selected filter is composited onto the captured frame via canvas at shutter time, and shown as a fixed overlay in the live camera view.
- **`images/` folder** — `orca_background.png` and `seal_background.png` added; imported as Vite asset URLs via `src/filterOverlays.ts`.
- **Tutorial screen** — new fourth screen; four steps with progressive disclosure, Back/Next navigation, step-dot indicator, and a Skip Tutorial shortcut.

### 2026-05-24 (Session 2)

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
