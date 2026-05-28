import type { FilterId } from "./types";
import orcaOverlay from "../images/orca_background.png";
import sealOverlay from "../images/seal_background.png";
import jellyfishOverlay from "../images/jellyfish_background.PNG";
import salmonOverlay from "../images/salmon_background.png";

export const FILTER_OVERLAYS: Partial<Record<FilterId, string>> = {
  orca: orcaOverlay,
  harbor_seal: sealOverlay,
  jellyfish: jellyfishOverlay,
  salmon: salmonOverlay,
};

export async function compositeWithOverlay(
  baseDataUrl: string,
  overlayUrl: string
): Promise<string> {
  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

  const [base, overlay] = await Promise.all([loadImg(baseDataUrl), loadImg(overlayUrl)]);

  const canvas = document.createElement("canvas");
  canvas.width = base.naturalWidth;
  canvas.height = base.naturalHeight;
  const ctx = canvas.getContext("2d");
  // iOS limits concurrent canvas contexts; fall back to unfiltered image if unavailable.
  if (!ctx) return baseDataUrl;
  ctx.drawImage(base, 0, 0);
  ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.95);
}
