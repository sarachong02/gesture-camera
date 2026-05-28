import { useEffect, useRef, useState } from "react";

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  captureFrame: () => string | null;
}

export function useCamera(): UseCameraReturn {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      // Guard: camera API requires HTTPS and a supporting browser.
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
        if (mounted) setError("Camera not available. Please use a supported browser over HTTPS.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            // play() returns a Promise on modern browsers; suppress iOS rejection
            // warnings for muted/playsInline video (should never actually reject).
            videoRef.current?.play().catch((err: unknown) => {
              console.warn("[GestureCamera] video.play() rejected:", err);
            });
            if (mounted) setIsReady(true);
          };
        }
      } catch (err) {
        if (!mounted) return;
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access.");
        } else if (err instanceof DOMException && err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          console.error("[GestureCamera] getUserMedia error:", err);
          setError("Could not access camera.");
        }
      }
    }

    startCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function captureFrame(): string | null {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Mirror to match the scaleX(-1) display
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.95);
  }

  return { videoRef, isReady, error, captureFrame };
}
