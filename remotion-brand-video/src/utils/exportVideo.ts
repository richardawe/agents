export interface ExportOptions {
  screenshot: string;
  brandName: string;
  siteUrl: string;
  onProgress?: (progress: number) => void;
}

const FPS = 30;
const TOTAL_FRAMES = 300; // 10 seconds
const WIDTH = 1280;
const HEIGHT = 720;

// ── Easing helpers ────────────────────────────────────────────────────────────

function easeOut(t: number): number {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

function easeInOut(t: number): number {
  const t2 = clamp01(t);
  return t2 < 0.5 ? 4 * t2 * t2 * t2 : 1 - Math.pow(-2 * t2 + 2, 3) / 2;
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

function remap(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  easing?: (t: number) => number,
): number {
  const t = (v - inMin) / (inMax - inMin);
  const e = easing ? easing(t) : t;
  return outMin + (outMax - outMin) * clamp01(e);
}

// ── Animation state (mirrors BrandVideo.tsx keyframes exactly) ────────────────

interface AnimState {
  opacity: number;
  scale: number;
  panY: number;
  overlayAlpha: number;
  textAlpha: number;
  textSlide: number;
}

function getAnimState(frame: number): AnimState {
  const opacity = remap(frame, 0, 25, 0, 1);

  let scale: number;
  if (frame <= 120) scale = remap(frame, 25, 120, 1, 1.5, easeOut);
  else if (frame <= 210) scale = 1.5;
  else scale = remap(frame, 210, 270, 1.5, 1, easeInOut);

  let panY = 0;
  if (frame >= 120 && frame <= 210) panY = remap(frame, 120, 210, 0, -HEIGHT * 0.2, easeInOut);
  else if (frame > 210 && frame <= 270) panY = remap(frame, 210, 270, -HEIGHT * 0.2, 0, easeInOut);

  const overlayAlpha = remap(frame, 265, 300, 0, 0.88);
  const textAlpha = remap(frame, 278, 300, 0, 1);
  const textSlide = remap(frame, 278, 300, 24, 0, easeOut);

  return { opacity, scale, panY, overlayAlpha, textAlpha, textSlide };
}

// ── Per-frame canvas draw ─────────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: number,
  brandName: string,
  siteUrl: string,
) {
  const { opacity, scale, panY, overlayAlpha, textAlpha, textSlide } = getAnimState(frame);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Page screenshot — scaled from top-center, panned vertically
  ctx.save();
  ctx.globalAlpha = clamp01(opacity);
  const drawW = WIDTH * scale;
  const drawH = HEIGHT * scale;
  const drawX = (WIDTH - drawW) / 2;
  ctx.drawImage(img, drawX, panY, drawW, drawH);
  ctx.restore();

  // Dark gradient overlay
  if (overlayAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = clamp01(overlayAlpha);
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, 'rgba(0,0,0,0.92)');
    grad.addColorStop(1, 'rgba(10,10,30,0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  // Brand name + URL text
  if (textAlpha > 0) {
    const centerY = HEIGHT / 2 + textSlide;

    ctx.save();
    ctx.globalAlpha = clamp01(textAlpha);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    ctx.font = `800 68px Inter, system-ui, sans-serif`;
    ctx.fillText(brandName || 'Brand Name', WIDTH / 2, centerY - 10, WIDTH - 96);

    if (siteUrl) {
      ctx.font = `400 22px Inter, system-ui, sans-serif`;
      ctx.globalAlpha = clamp01(textAlpha * 0.55);
      ctx.fillText(siteUrl.toUpperCase(), WIDTH / 2, centerY + 52, WIDTH - 96);
    }
    ctx.restore();
  }
}

// ── Public export function ────────────────────────────────────────────────────

export async function exportVideo({
  screenshot,
  brandName,
  siteUrl,
  onProgress,
}: ExportOptions): Promise<Blob> {
  const img = new Image();
  img.src = screenshot;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not load screenshot for export'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(100); // flush chunks every 100 ms

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    drawFrame(ctx, img, frame, brandName, siteUrl);
    onProgress?.(frame / TOTAL_FRAMES);
    // Wait one frame-period so the canvas stream captures it at the right rate
    await new Promise<void>((r) => setTimeout(r, 1000 / FPS));
  }

  recorder.stop();

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
}
