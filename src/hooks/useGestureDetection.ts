import { useEffect, useRef, useState, useCallback } from "react";
import type { DetectedGesture, GestureState, PalmPosition } from "../types";

// ── MediaPipe landmark indices ─────────────────────────────────────────────
const WRIST      = 0;
const INDEX_MCP  = 5;
const MIDDLE_MCP = 9;
const RING_MCP   = 13;
const PINKY_MCP  = 17;

const INDEX_TIP  = 8;  const INDEX_PIP  = 6;
const MIDDLE_TIP = 12; const MIDDLE_PIP = 10;
const RING_TIP   = 16; const RING_PIP   = 14;
const PINKY_TIP  = 20; const PINKY_PIP  = 18;

const PEACE_HOLD_MS = 3000;

// How long after countdown starts before an open palm can cancel it.
// This prevents the peace-sign pose from briefly triggering detectOpenPalm
// at the exact moment of transition (ring/pinky may not be fully curled).
const COUNTDOWN_CANCEL_DELAY_MS = 1500;

export type Landmark = { x: number; y: number; z: number };

// ── Gesture classifiers ────────────────────────────────────────────────────

// Open palm: all 4 fingertips clearly above their PIP joints
function detectOpenPalm(lm: Landmark[]): boolean {
  return (
    lm[INDEX_TIP].y  < lm[INDEX_PIP].y  &&
    lm[MIDDLE_TIP].y < lm[MIDDLE_PIP].y &&
    lm[RING_TIP].y   < lm[RING_PIP].y   &&
    lm[PINKY_TIP].y  < lm[PINKY_PIP].y
  );
}

// Peace sign: index + middle extended above PIP, ring + pinky curled below PIP
function detectPeaceSign(lm: Landmark[]): boolean {
  return (
    lm[INDEX_TIP].y  < lm[INDEX_PIP].y  &&
    lm[MIDDLE_TIP].y < lm[MIDDLE_PIP].y &&
    lm[RING_TIP].y   > lm[RING_PIP].y   &&
    lm[PINKY_TIP].y  > lm[PINKY_PIP].y
  );
}

// Palm center = average of wrist + four MCP knuckles
function getPalmCenter(lm: Landmark[]): PalmPosition {
  const pts = [WRIST, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP];
  const sum  = pts.reduce(
    (acc, i) => ({ x: acc.x + lm[i].x, y: acc.y + lm[i].y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / pts.length, y: sum.y / pts.length };
}

// Squared Euclidean distance between two palm positions (for comparison only)
function palmDistSq(a: PalmPosition, b: PalmPosition): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// ── Hook ──────────────────────────────────────────────────────────────────

interface UseGestureDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  gestureState: GestureState;
}

interface GestureDetectionState {
  gesture: DetectedGesture;
  palmPosition: PalmPosition | null;
  /** Updated every detection frame without causing re-renders — safe to read inside rAF loops */
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  isLoading: boolean;
  error: string | null;
  /** 0–1: how long the peace sign has been continuously held (relative to PEACE_HOLD_MS) */
  peaceSignProgress: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandLandmarkerInstance = any;

export function useGestureDetection({
  videoRef,
  enabled,
  gestureState,
}: UseGestureDetectionOptions): GestureDetectionState {
  const [gesture, setGesture]           = useState<DetectedGesture>("none");
  const [palmPosition, setPalmPosition] = useState<PalmPosition | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [peaceSignProgress, setPeaceSignProgress] = useState(0);

  const landmarkerRef     = useRef<HandLandmarkerInstance>(null);
  const landmarksRef      = useRef<Landmark[] | null>(null);
  const rafRef            = useRef<number>(0);
  const lastVideoTimeRef  = useRef<number>(-1);
  const positionBufferRef = useRef<PalmPosition[]>([]);
  const peaceSignStartRef = useRef<number | null>(null);

  // Proximity-based hand lock: position of the last-selected hand.
  // When multiple hands are in frame, we always pick the one closest to this.
  // Null means no lock yet (reset on retake).
  const lockedPalmRef = useRef<PalmPosition | null>(null);

  // Timestamp set the moment gestureState enters "countdown".
  // Open-palm cancel is suppressed until COUNTDOWN_CANCEL_DELAY_MS passes.
  const countdownStartRef = useRef<number | null>(null);

  // Mirror gestureState into a ref so the rAF loop always reads the latest value
  // without needing to be recreated on every state change.
  const gestureStateRef   = useRef<GestureState>(gestureState);
  gestureStateRef.current = gestureState;

  // Reset all session state when returning to waiting (retake / fresh start)
  useEffect(() => {
    if (gestureState === "waiting") {
      lockedPalmRef.current     = null;
      peaceSignStartRef.current = null;
      countdownStartRef.current = null;
      setPeaceSignProgress(0);
    }
    if (gestureState !== "countdown") {
      countdownStartRef.current = null;
    }
  }, [gestureState]);

  function smoothPosition(raw: PalmPosition): PalmPosition {
    positionBufferRef.current.push(raw);
    if (positionBufferRef.current.length > 5) positionBufferRef.current.shift();
    const n   = positionBufferRef.current.length;
    const sum = positionBufferRef.current.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return { x: sum.x / n, y: sum.y / n };
  }

  useEffect(() => {
    let cancelled = false;

    async function initMediaPipe() {
      try {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          // Track up to 2 hands so we can pick the locked one when multiple people are in frame.
          // Gesture classification still only uses one (the tracked hand).
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load gesture model");
          setIsLoading(false);
        }
      }
    }

    initMediaPipe();
    return () => { cancelled = true; };
  }, []);

  const detect = useCallback(() => {
    const video      = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const results = landmarker.detectForVideo(video, performance.now());
      const state   = gestureStateRef.current;

      if (results.landmarks && results.landmarks.length > 0) {
        // ── Proximity-based hand selection ────────────────────────────────
        // When multiple hands are detected, prefer the one closest to the
        // last known palm position. This keeps the tracked user's hand
        // selected even when another person enters the frame.
        // Note: we intentionally do NOT use MediaPipe's handedness field —
        // it reflects camera-relative left/right (inverted vs display) and
        // is inconsistent between detection and tracking modes.
        let selectedIndex = 0;
        if (results.landmarks.length > 1 && lockedPalmRef.current) {
          let minDist = Infinity;
          for (let i = 0; i < results.landmarks.length; i++) {
            const dist = palmDistSq(getPalmCenter(results.landmarks[i] as Landmark[]), lockedPalmRef.current);
            if (dist < minDist) { minDist = dist; selectedIndex = i; }
          }
        }

        const lm: Landmark[]  = results.landmarks[selectedIndex] as Landmark[];
        const rawCenter        = getPalmCenter(lm);

        // Always update the proximity lock so we keep tracking the right hand.
        lockedPalmRef.current = rawCenter;

        // ── Gesture classification ────────────────────────────────────────
        if (state === "countdown") {
          // During countdown we must NOT push palmPosition state.
          // smoothPosition() always returns a new object, so calling
          // setPalmPosition every camera frame causes CameraScreen to
          // re-render at ~60 fps. That makes handleCountdownComplete
          // a new reference each render, which changes the onComplete prop
          // of CountdownOverlay, which re-runs its useEffect and resets the
          // 1-second tick — pausing the countdown while any hand is in frame.
          //
          // Pan/tilt is inactive during countdown, so palmPosition is unused.
          // Clear landmarks too; the skeleton overlay is already hidden.
          landmarksRef.current = null;

          // Start the cooldown timer on first countdown frame.
          if (countdownStartRef.current === null) {
            countdownStartRef.current = performance.now();
          }

          peaceSignStartRef.current = null;
          setPeaceSignProgress(0);

          // Suppress open-palm cancel for COUNTDOWN_CANCEL_DELAY_MS after
          // countdown begins. This prevents the peace-sign hand pose from
          // briefly triggering detectOpenPalm during the transition frame
          // (ring/pinky may not yet be fully curled when the timer fires).
          const age = performance.now() - countdownStartRef.current;
          if (age > COUNTDOWN_CANCEL_DELAY_MS && detectOpenPalm(lm)) {
            setGesture("open_palm");
          } else {
            setGesture("none");
          }
        } else {
          // waiting / calibrated: update overlay and classify gestures
          landmarksRef.current = lm;
          setPalmPosition(smoothPosition(rawCenter));

          if (detectPeaceSign(lm)) {
            if (peaceSignStartRef.current === null) {
              peaceSignStartRef.current = performance.now();
            }
            const elapsed  = performance.now() - peaceSignStartRef.current;
            const progress = Math.min(elapsed / PEACE_HOLD_MS, 1);
            setPeaceSignProgress(progress);
            setGesture("peace_sign");
          } else if (detectOpenPalm(lm)) {
            peaceSignStartRef.current = null;
            setPeaceSignProgress(0);
            setGesture("open_palm");
          } else {
            peaceSignStartRef.current = null;
            setPeaceSignProgress(0);
            setGesture("none");
          }
        }
      } else {
        // No hand in frame — clear everything, but keep lockedPalmRef so
        // re-entry of the same user's hand is still preferred.
        landmarksRef.current = null;
        positionBufferRef.current = [];
        peaceSignStartRef.current = null;
        setPalmPosition(null);
        setPeaceSignProgress(0);
        setGesture("none");
      }
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [videoRef]);

  useEffect(() => {
    if (!enabled || isLoading) return;
    rafRef.current = requestAnimationFrame(detect);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [enabled, isLoading, detect]);

  return { gesture, palmPosition, landmarksRef, isLoading, error, peaceSignProgress };
}
