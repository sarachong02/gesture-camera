---
name: project-gesture-rules
description: Current gesture rules and state machine for gesture camera booth — peace sign triggers countdown, open palm cancels, single-hand locking
metadata:
  type: project
---

Gesture trigger changed from fist → peace sign (index+middle extended, ring+pinky curled, held 3 continuous seconds).

**Why:** Fist was too easy to accidentally trigger; peace sign is a distinct intentional pose suitable for a photo booth context.

**How to apply:** If asked about gesture triggers, the current system uses peace sign for countdown start, open palm for calibration and countdown cancel. Fist is no longer detected.

Key behaviors as of 2026-05-24:
- waiting → open palm → calibrated
- calibrated → peace sign held 3s → countdown
- countdown → open palm (only) → calibrated (cancel)
- countdown → photo taken on zero (all other gestures ignored)
- Single-hand lock: first detected hand's handedness is stored; other handedness is ignored (lockedHandednessRef in useGestureDetection.ts)
- Peace sign progress ring (SVG arc) shown centered on screen during calibrated state
- GestureFeedback shows "Hold peace sign · Xs" countdown text

Related files: [[project-file-map]]
