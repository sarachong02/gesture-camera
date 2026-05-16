import { useEffect, useRef, useState, useCallback } from "react";
import type { DetectedGesture, PalmPosition } from "../types";

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

export type Landmark = { x: number; y: number; z: number };

// ── Gesture classifiers ────────────────────────────────────────────────────

// Open palm: all 4 finger tips sit above their MCP knuckles (Y increases downward)
function detectOpenPalm(lm: Landmark[]): boolean {
  return (
    lm[INDEX_TIP].y  < lm[INDEX_MCP].y  &&
    lm[MIDDLE_TIP].y < lm[MIDDLE_MCP].y &&
    lm[RING_TIP].y   < lm[RING_MCP].y   &&
    lm[PINKY_TIP].y  < lm[PINKY_MCP].y
  );
}

// Fist: tip below its PIP joint means finger is curled. Require 3-of-4.
function detectFist(lm: Landmark[]): boolean {
  const curled = [
    lm[INDEX_TIP].y  > lm[INDEX_PIP].y,
    lm[MIDDLE_TIP].y > lm[MIDDLE_PIP].y,
    lm[RING_TIP].y   > lm[RING_PIP].y,
    lm[PINKY_TIP].y  > lm[PINKY_PIP].y,
  ].filter(Boolean).length;
  return curled >= 3;
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

// ── Hook ──────────────────────────────────────────────────────────────────

interface UseGestureDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
}

interface GestureDetectionState {
  gesture: DetectedGesture;
  palmPosition: PalmPosition | null;
  /** Updated every detection frame without causing re-renders — safe to read inside rAF loops */
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  isLoading: boolean;
  error: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandLandmarkerInstance = any;

export function useGestureDetection({
  videoRef,
  enabled,
}: UseGestureDetectionOptions): GestureDetectionState {
  const [gesture, setGesture]           = useState<DetectedGesture>("none");
  const [palmPosition, setPalmPosition] = useState<PalmPosition | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const landmarkerRef    = useRef<HandLandmarkerInstance>(null);
  const landmarksRef     = useRef<Landmark[] | null>(null);
  const rafRef           = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const positionBufferRef = useRef<PalmPosition[]>([]);

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
          numHands: 1,
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

      if (results.landmarks && results.landmarks.length > 0) {
        const lm: Landmark[] = results.landmarks[0];
        landmarksRef.current = lm;
        setPalmPosition(smoothPosition(getPalmCenter(lm)));

        if (detectOpenPalm(lm)) {
          setGesture("open_palm");
        } else if (detectFist(lm)) {
          setGesture("closed_fist");
        } else {
          setGesture("none");
        }
      } else {
        landmarksRef.current = null;
        positionBufferRef.current = [];
        setPalmPosition(null);
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

  return { gesture, palmPosition, landmarksRef, isLoading, error };
}
