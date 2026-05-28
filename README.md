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
| Thumbs up (post-capture) | Save photo |
| Thumbs down (post-capture) | Discard photo and retake |
| Hand closer to camera | Zoom in (gesture-controlled zoom) |
| Hand farther from camera | Zoom out |

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

## Handoff — 2026-05-26 (Session 5)

### What was worked on

Five targeted improvements: on-screen phone keypad, gesture-driven tutorial overhaul, thumbs-up/down detection in the type system and post-capture flow, a visible camera viewport in `CameraGateScreen`, and gesture-controlled zoom.

---

#### Change 1 — Phone number screen: on-screen numeric keypad

`PhoneScreen` no longer relies on the device keyboard. An iOS-style 12-key grid (1–9, blank, 0, delete) is always visible on screen.

- Keys are `h-16 rounded-2xl bg-white/10` with `active:scale-95` press feedback.
- Delete key uses a filled backspace SVG icon; numbers are `text-2xl font-light`.
- `handleKeyPress` guards against input exceeding 10 digits.
- All existing logic preserved: `value` state, `formatDisplay`, `handleSubmit`, `isValid`.

**Key files changed:**
- `src/screens/PhoneScreen.tsx` — `<input>` replaced with display div + keypad grid; `handleKeyPress` added

---

#### Change 2 — Tutorial overhaul: gesture-gated, full-screen camera, new steps

The tutorial now runs entirely through gesture detection. Manual Next/Back buttons are gone except for a Back chevron (first step hides it) and a "Skip Tutorial" pill in the bottom-right corner.

**Camera viewport:** Square, `width: min(60vh, 88vw)`, `aspectRatio: 1/1`, rounded corners. Occupies roughly two-thirds of screen height.

**New step list (6 steps):**

| Step | Title | Required gesture |
|---|---|---|
| 1 | Calibrate | `open_palm` |
| 2 | Start Countdown | `peace_sign` |
| 3 | During Countdown | `thumbs_up` |
| 4 | Cancel Countdown | `open_palm` |
| 5 | Confirm & Save | `thumbs_up` |
| 6 | Retake | `thumbs_down` |

**Progression logic:**
- 500 ms continuous correct gesture → `succeeded = true` (green overlay + checkmark).
- 800 ms after success → auto-advance (or call `onComplete` on last step).
- Wrong gesture or gesture drop → timer clears, no advance.

**UI improvements:**
- Title: `text-xl` → `text-2xl`; description: `text-sm` → `text-base`; feedback badge: `text-xs` → `text-sm`.
- Instruction section gap: `gap-4` → `gap-5`.
- Gesture reference icon shown as a badge in the camera viewport's bottom-right corner; glows green when gesture matches.

**Key files changed:**
- `src/screens/TutorialScreen.tsx` — rewritten; `STEPS` array extended; gesture-detection loop added; success/advance effects added

---

#### Change 3 — Thumbs up / down added to gesture pipeline

`detectThumbsUp` and `detectThumbsDown` classifiers added to `useGestureDetection`. Both check that all four fingers are curled (tip Y > PIP Y) and that the thumb tip is above (`thumbs_up`) or below (`thumbs_down`) the thumb MCP.

Detection order in the non-countdown branch: `peace_sign → thumbs_up → thumbs_down → open_palm → none`.

`ThumbsDownIcon` added to `GestureIcons.tsx` — mathematically derived by reflecting `THUMBS_UP_LM` (`x_new = 100 - x`, `y_new = 120 - y`).

**Key files changed:**
- `src/types.ts` — `DetectedGesture` union extended with `"thumbs_up"` and `"thumbs_down"`
- `src/hooks/useGestureDetection.ts` — `THUMB_TIP`, `THUMB_MCP` constants; `detectThumbsUp`, `detectThumbsDown`; detection order updated
- `src/components/GestureIcons.tsx` — `THUMBS_DOWN_LM`, `ThumbsDownIcon` added

---

#### Change 4 — Post-capture gesture flow

`CaptureScreen` now runs a hidden camera stream and `useGestureDetection` to let users save or retake via gesture after the photo is taken.

- Thumbs up: 500 ms confirmation → `gestureAction = "save"` → 800 ms delay → download file + `onSave()`.
- Thumbs down: same timing → `gestureAction = "retake"` → `onRetake()`.
- `handleSaveRef` / `onRetakeRef` ref pattern prevents stale closures without adding timeout deps.
- A gesture hint pill (`ThumbsDownIcon · ThumbsUpIcon`) highlights the active gesture in real time.
- Manual Retake / Save buttons kept as accessible fallbacks.

**Key files changed:**
- `src/screens/CaptureScreen.tsx` — hidden `<video>` + `useGestureDetection` added; gesture confirm effects; hint pill; success overlay

---

#### Change 5 — CameraGateScreen: visible camera viewport

`CameraGateScreen` previously kept the camera offscreen. Now it shows the same `min(60vh, 88vw)` square viewport used in the tutorial.

- SVG progress arc overlaid on the camera fills as the thumbs-up is held.
- `ThumbsUpIcon` badge shown in the bottom-right corner of the viewport.
- Loading overlay displayed until MediaPipe is ready.

**Key files changed:**
- `src/screens/CameraGateScreen.tsx` — video element made visible; arc + badge overlaid

---

#### Change 6 — Gesture-controlled zoom

Hand proximity (bounding-box diagonal of all 21 landmarks) drives camera zoom in `CameraScreen`.

- `getHandSpan(lm)` computes the bounding-box diagonal of all 21 normalized landmarks.
- `handSpanBufferRef` keeps a 5-frame rolling average for smoothing.
- Normalized to `[HAND_SPAN_MIN = 0.20, HAND_SPAN_MAX = 0.65]` → clamped `handSize` in `[0, 1]`.
- `zoomScale = BASE_SCALE + handSize * (ZOOM_MAX_SCALE - BASE_SCALE)` = 1.15–1.60.
- Zoom updates suspended during countdown (same pattern as `setPalmPosition`) to prevent re-render chain that pauses the countdown timer.
- CSS transition eased to `0.15s` for smooth zoom feel.

**Key files changed:**
- `src/hooks/useGestureDetection.ts` — `getHandSpan`, `HAND_SPAN_MIN/MAX`, `handSpanBufferRef`, `handSize` state; returned in hook result
- `src/screens/CameraScreen.tsx` — `ZOOM_MAX_SCALE = 1.6`; `zoomScale` computed; applied to transform; transition eased

---

### State of the codebase (as of 2026-05-27)

**Full start flow:**
```
Start → Phone number → Filter selection → Tutorial (6 gesture steps) → Camera gate (thumbs up) → Camera → Capture (thumbs up/down) → Thank you
                                                                       ↑ Skip Tutorial bypasses gate ────────────────────────────────┘
```

**Gesture system in `useGestureDetection`:**
- All four gestures (`open_palm`, `peace_sign`, `thumbs_up`, `thumbs_down`) detected in a single hook.
- `gestureState` passed in to restrict detection during countdown (open-palm cancel only, with 1500 ms grace).
- `handSize` (0–1) exposed for zoom; `peaceSignProgress` (0–1) exposed for arc UI.
- `lockedPalmRef` maintains single-user tracking across multi-hand frames.
- `landmarksRef` for zero-render-cost skeleton overlay drawing.
- `useThumbsUpDetection` is a separate, simpler hook used only by `CameraGateScreen` — left untouched.

**Re-render safety:** Neither `setPalmPosition` nor `setHandSize` is called during countdown state. This is load-bearing — calling either during countdown produces a 60 fps re-render chain that resets `CountdownOverlay`'s timer via unstable `onComplete` reference.

---

### Suggested next steps

- `peaceSignProgress >= 1` triggers the countdown instantly. A 200 ms "flash" animation on the progress arc at completion (e.g., brief white fill before the arc hides) would give clearer feedback that the hold succeeded.
- The tutorial `COUNTDOWN_CANCEL_DELAY_MS` grace window is 1500 ms. If testers report the cancel gesture feels sluggish, try 800–1000 ms.
- `CameraGateScreen` starts a new MediaPipe instance on mount. Pre-initializing the landmarker during the tutorial (background load while user reads steps) would eliminate the brief loading overlay on the gate screen.
- Zoom range is `BASE_SCALE = 1.15` to `ZOOM_MAX_SCALE = 1.60`. If the zoom feels too sensitive or not sensitive enough, tune `HAND_SPAN_MIN`/`HAND_SPAN_MAX` in `useGestureDetection.ts` without touching any other files.
- No SMS backend is wired. The phone number is stored in `App` state as `_phoneNumber`; a Twilio/AWS SNS integration would read from there after the capture flow.

---

## Handoff — 2026-05-27 (Session 6)

### What was worked on

Two features: a QR-gated custom filter on the filter selection screen, and a set of zoom stabilization fixes in the gesture detection pipeline.

---

#### Change 1 — "Custom" filter unlocked via QR scan

A new **Custom** button was added to the filter selection bar, positioned immediately to the right of the "No Filter" card.

**First-time flow (QR not yet scanned):**
- Tapping **Custom** opens a full-screen QR scan modal layered over the existing filter-preview camera feed.
- The modal shows the live camera stream inside a square viewfinder (clipped, rounded corners) with animated corner-bracket guides and a horizontal sweep line that travels top-to-bottom on a 2-second loop.
- After 2 seconds of "scanning," the phase transitions to **detected**: the viewfinder border turns green with a glow (`ring-2 ring-green-400`), a green checkmark overlay appears, and the status text turns green — "QR Code Detected."
- 1.2 seconds later the modal closes automatically and the jellyfish background is applied as the active filter.
- The unlock is **session-only** (React state, no `localStorage`/`sessionStorage`). Reloading the page or starting a new user session requires scanning again.

**After unlock:**
- The Custom card thumbnail switches from the QR icon to the jellyfish overlay image.
- Tapping the card directly applies the jellyfish filter — no modal.
- The card follows the same active/inactive styling as all other filter cards.
- Users can freely switch between Custom and any other filter.

**Camera feed reuse:** The QR modal clones the `MediaStream` already attached to the filter-screen's preview video (`videoRef.current.srcObject`) onto a second `<video>` element inside the modal. No second `getUserMedia` call is made.

**Key files changed:**
- `src/types.ts` — `"jellyfish"` added to `FilterId`
- `src/filterOverlays.ts` — `jellyfish_background.PNG` imported; `jellyfish` key added to `FILTER_OVERLAYS`
- `src/vite-env.d.ts` — `declare module "*.PNG"` added to resolve the uppercase extension
- `src/screens/FilterScreen.tsx` — `jellyfishUnlocked` state; `qrVideoRef`; stream-clone effect; QR timing effect; modal JSX; Custom button injected after No Filter via `FILTERS.flatMap`

---

#### Change 2 — Zoom stabilization

Three layers of fixes to prevent jitter and premature zoom changes.

**Gate on calibration state (`CameraScreen.tsx`):**
`zoomScale` is clamped to `BASE_SCALE` (1.15×) while `gestureState === "waiting"`. Zoom cannot change at all until the user has completed their first open-palm calibration. This eliminates the entire class of "zoom jumps on app load" issues.

**Stable-frames warmup (`useGestureDetection.ts`):**
A new `handStableFramesRef` counter increments each frame a hand is present. `setHandSize` is not called until the counter reaches `HAND_STABLE_MIN_FRAMES = 6`, discarding the first ~6 noisy frames every time a hand enters frame. The counter resets to 0 whenever the hand leaves frame, so re-entry also gets the warmup treatment.

**Larger rolling average buffer (`useGestureDetection.ts`):**
`handSpanBufferRef` now keeps the last 8 frames (up from 5). Combined with the warmup gate, this produces a smoother, less jittery zoom value.

**Key files changed:**
- `src/screens/CameraScreen.tsx` — `zoomScale` gated on `gestureState !== "waiting"`
- `src/hooks/useGestureDetection.ts` — `HAND_STABLE_MIN_FRAMES` constant; `handStableFramesRef`; buffer size 5 → 8; warmup gate around `setHandSize`; `handStableFramesRef` reset in no-hand branch

---

#### Change 3 — Tutorial step removed

The "During Countdown" tutorial step (step 3 of 6, thumbs-up gesture) was removed. The tutorial now has **5 steps**: Calibrate → Start Countdown → Cancel Countdown → Confirm & Save → Retake.

**Key files changed:**
- `src/screens/TutorialScreen.tsx` — "During Countdown" entry removed from `STEPS` array

---

### Updated start flow

```
Start → Phone number → Filter selection → Tutorial (5 gesture steps) → Camera gate (thumbs up) → Camera → Capture (thumbs up/down) → Thank you
                                                                       ↑ Skip Tutorial bypasses gate ────────────────────────────────┘
```

---

### Suggested next steps

- The QR scan is fully mocked. A real implementation could use a library like `jsQR` on the same `qrVideoRef` video element — each frame, draw to an offscreen canvas and call `jsQR(imageData)`. The existing timing/feedback scaffolding would need minimal changes.
- `HAND_STABLE_MIN_FRAMES = 6` targets ~100 ms at 60 fps. If zoom still feels laggy on first hand entry, try lowering to 4. If jitter persists in low-light (slower detection), raise to 8.
- The jellyfish unlock resets every session by design. If the booth runs continuously and re-scanning feels disruptive, a URL parameter (e.g. `?unlocked=1`) could pre-set `jellyfishUnlocked` without adding any persistence layer.

---

## Changelog

### 2026-05-27 (Session 6)

- **Custom filter via QR scan** — new "Custom" button added to the filter bar (next to "No Filter"). Tapping opens a live-camera QR scan modal with corner-bracket guides, an animated sweep line, and a green glow/checkmark on detection. Unlock is session-only (React state); reloading resets it. After unlock, the button directly selects the jellyfish background like any other filter. Camera stream is reused from the existing filter-screen preview — no second `getUserMedia` call.
- **Jellyfish background** — `jellyfish_background.PNG` added to `FILTER_OVERLAYS`; composited onto captures and shown as a live overlay in `CameraScreen` identical to Orca/Harbor Seal.
- **Zoom gated on calibration** — `zoomScale` now stays at `BASE_SCALE` (1.15×) until `gestureState` leaves `"waiting"`. No zoom change is possible before the first open-palm calibration.
- **Zoom warmup frames** — first 6 consecutive frames after a hand enters frame are buffered but do not emit `handSize`. Eliminates the initial detection-noise spike. Counter resets on hand exit so re-entry also gets the warmup.
- **Larger zoom buffer** — `handSpanBufferRef` window increased from 5 to 8 frames for a smoother rolling average.
- **Tutorial trimmed** — "During Countdown" step removed; tutorial is now 5 gesture steps.

### 2026-05-26 (Session 5)

- **On-screen phone keypad** — `PhoneScreen` now shows an iOS-style 12-key numeric grid (0–9, delete, continue) instead of relying on the device keyboard. Touch-friendly for iPad; existing format/validate logic preserved.
- **Gesture-driven tutorial** — all 6 tutorial steps require a real detected gesture to advance; manual Next button removed. 500 ms hold → success indicator → 800 ms → auto-advance. Camera viewport enlarged to `min(60vh, 88vw)` square. Text sizes and spacing improved for readability at distance. Skip Tutorial moved to bottom-right.
- **New tutorial steps** — "During Countdown" (thumbs up), "Confirm & Save" (thumbs up), and "Retake" (thumbs down) steps added to teach post-capture gestures before the camera.
- **Thumbs up / down detection** — `detectThumbsUp` and `detectThumbsDown` classifiers added to `useGestureDetection`; `DetectedGesture` type extended; `ThumbsDownIcon` added to `GestureIcons`.
- **Post-capture gesture flow** — `CaptureScreen` detects thumbs up (save) and thumbs down (retake) via hidden camera stream; 500 ms confirm + 800 ms display timing; manual buttons kept as fallback.
- **Visible CameraGateScreen** — gate screen now shows a visible camera feed in the same square viewport, with SVG arc overlay and thumbs-up icon badge.
- **Gesture-controlled zoom** — hand proximity (MediaPipe bounding-box diagonal, 5-frame smoothed) drives zoom from 1.15× to 1.60× in `CameraScreen`. Zoom suspended during countdown to preserve timer stability.

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
