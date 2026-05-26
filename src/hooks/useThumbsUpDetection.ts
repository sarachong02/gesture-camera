import { useEffect, useRef, useState, useCallback } from "react";

type Landmark = { x: number; y: number; z: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandLandmarkerInstance = any;

// Thumb clearly extended (tip above MCP), all 4 fingers curled (tips below their PIPs)
function detectThumbsUp(lm: Landmark[]): boolean {
  return (
    lm[4].y  < lm[2].y  &&
    lm[8].y  > lm[6].y  &&
    lm[12].y > lm[10].y &&
    lm[16].y > lm[14].y &&
    lm[20].y > lm[18].y
  );
}

const HOLD_MS = 800;

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onDetected: () => void;
}

interface Result {
  isLoading: boolean;
  error: string | null;
  /** 0–1: how long thumbs-up has been continuously held relative to HOLD_MS */
  progress: number;
}

export function useThumbsUpDetection({ videoRef, onDetected }: Options): Result {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [progress, setProgress]   = useState(0);

  const landmarkerRef   = useRef<HandLandmarkerInstance>(null);
  const rafRef          = useRef<number>(0);
  const lastTimeRef     = useRef(-1);
  const holdStartRef    = useRef<number | null>(null);
  const firedRef        = useRef(false);
  const onDetectedRef   = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    let cancelled = false;
    async function init() {
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
    init();
    return () => { cancelled = true; };
  }, []);

  const detect = useCallback(() => {
    const video      = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    if (video.currentTime !== lastTimeRef.current) {
      lastTimeRef.current = video.currentTime;
      const results = landmarker.detectForVideo(video, performance.now());

      if (results.landmarks && results.landmarks.length > 0) {
        const lm: Landmark[] = results.landmarks[0];
        if (detectThumbsUp(lm)) {
          if (holdStartRef.current === null) holdStartRef.current = performance.now();
          const p = Math.min((performance.now() - holdStartRef.current) / HOLD_MS, 1);
          setProgress(p);
          if (p >= 1 && !firedRef.current) {
            firedRef.current = true;
            onDetectedRef.current();
          }
        } else {
          holdStartRef.current = null;
          setProgress(0);
        }
      } else {
        holdStartRef.current = null;
        setProgress(0);
      }
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [videoRef]);

  useEffect(() => {
    if (isLoading) return;
    rafRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isLoading, detect]);

  return { isLoading, error, progress };
}
