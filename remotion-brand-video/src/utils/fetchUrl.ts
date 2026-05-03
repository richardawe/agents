import type { Feature, PageAnalysis } from '../types';
import { CAP_W, CAP_H } from '../types';

export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : 'https://' + t;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read screenshot'));
    reader.readAsDataURL(blob);
  });
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode screenshot'));
    img.src = src;
  });
}

/**
 * Crop a viewport-sized slice from a full-page screenshot.
 * The image is already CAP_W pixels wide (served by thum.io at that width).
 */
function cropViewport(img: HTMLImageElement, y: number): string {
  const canvas = document.createElement('canvas');
  canvas.width  = CAP_W;
  canvas.height = CAP_H;
  const ctx = canvas.getContext('2d')!;
  const srcH = Math.min(CAP_H, img.naturalHeight - y);
  ctx.drawImage(img, 0, y, CAP_W, srcH, 0, 0, CAP_W, srcH);
  return canvas.toDataURL('image/jpeg', 0.88);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetches a full-page screenshot of the URL via thum.io (no API key required),
 * slices it into mobile-viewport sections, and returns a PageAnalysis ready
 * for the video pipeline — identical to uploading an HTML file.
 */
export async function fetchUrlScreenshots(
  rawUrl: string,
  onProgress?: (msg: string) => void,
): Promise<PageAnalysis> {
  const url = normalizeUrl(rawUrl);
  const hostname = new URL(url).hostname.replace(/^www\./, '');

  onProgress?.('Taking screenshot…');

  // thum.io renders the page headlessly at CAP_W px width and returns the
  // full-page JPEG — no auth needed for the free tier.
  const thumbUrl = `https://image.thum.io/get/width/${CAP_W}/fullpage/${url}`;

  let res: Response;
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 35_000);
    res = await fetch(thumbUrl, { signal: ctrl.signal });
    clearTimeout(timer);
  } catch {
    throw new Error(
      'Could not reach the screenshot service — check your connection, or upload the HTML file directly.',
    );
  }

  if (!res.ok) {
    throw new Error(
      `Screenshot service returned ${res.status}. The site may block screenshots — try uploading the HTML file.`,
    );
  }

  onProgress?.('Processing screenshot…');
  const dataUrl = await blobToDataUrl(await res.blob());
  const img     = await loadImg(dataUrl);

  // Above-the-fold hero
  const fullScreenshot = cropViewport(img, 0);

  // Up to 4 additional sections (every CAP_H pixels)
  const features: Feature[] = [];
  for (let i = 0; i < 4; i++) {
    const y = (i + 1) * CAP_H;
    if (y >= img.naturalHeight) break;
    features.push({
      id: `feat-url-${i}`,
      title: '',
      description: '',
      screenshot: cropViewport(img, y),
      scrollY: y,
    });
  }

  return { fullScreenshot, title: hostname, description: '', features, accentColor: '#6366f1' };
}
