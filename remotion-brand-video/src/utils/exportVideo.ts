import type { Feature, PageAnalysis } from '../types';
import {
  calcTotalFrames,
  FEATURE_FRAMES,
  FPS,
  INTRO_FRAMES,
  OUTRO_FRAMES,
} from '../types';

const W = 1280;
const H = 720;

// ── Easing / math helpers ──────────────────────────────────────────────────────

function c01(t: number) { return Math.min(1, Math.max(0, t)); }

function remap(v: number, i0: number, i1: number, o0: number, o1: number, ease?: (t: number) => number): number {
  const t = (v - i0) / (i1 - i0);
  const e = ease ? ease(t) : t;
  return o0 + (o1 - o0) * c01(e);
}

const easeOut  = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const easeInOut = (t: number) => { const t2 = c01(t); return t2 < 0.5 ? 4*t2*t2*t2 : 1 - Math.pow(-2*t2+2,3)/2; };
const easeSine  = (t: number) => -(Math.cos(Math.PI * c01(t)) - 1) / 2;

// ── Image preload ──────────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for export'));
    img.src = src;
  });
}

// ── Scene draw functions ───────────────────────────────────────────────────────

function drawIntro(
  ctx: CanvasRenderingContext2D,
  fullImg: HTMLImageElement,
  lf: number, // local frame 0..INTRO_FRAMES-1
  brandName: string,
  accentColor: string,
) {
  const opacity      = remap(lf, 0, 20, 0, 1);
  const scale        = remap(lf, 20, INTRO_FRAMES, 1.0, 1.08, easeSine);
  const titleOpacity = remap(lf, 55, 85, 0, 1);
  const titleY       = remap(lf, 55, 85, 22, 0, easeOut);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Screenshot (zoom from top-center)
  ctx.save();
  ctx.globalAlpha = c01(opacity);
  const dw = W * scale, dh = H * scale;
  ctx.drawImage(fullImg, (W - dw) / 2, 0, dw, dh);
  ctx.restore();

  // Bottom gradient
  ctx.save();
  ctx.globalAlpha = c01(opacity);
  const g = ctx.createLinearGradient(0, H * 0.42, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Brand name
  if (titleOpacity > 0) {
    const y = H - 68 + titleY;
    ctx.save();
    ctx.globalAlpha = c01(titleOpacity);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '800 52px Inter, system-ui, sans-serif';
    ctx.fillText(brandName || 'Brand Name', W / 2, y, W - 96);
    // Accent bar
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 28, y + 16, 56, 4, 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFeature(
  ctx: CanvasRenderingContext2D,
  featImg: HTMLImageElement,
  lf: number,
  feature: Feature,
  featureIndex: number,
  totalFeatures: number,
  accentColor: string,
) {
  const opacity      = remap(lf, 0, 25, 0, 1);
  const scale        = remap(lf, 0, FEATURE_FRAMES, 1.02, 1.12, easeSine);
  const panelOpacity = remap(lf, 28, 58, 0, 1);
  const accentW      = remap(lf, 42, 82, 0, 52, easeOut);
  const titleOpacity = remap(lf, 48, 78, 0, 1);
  const titleX       = remap(lf, 48, 78, -18, 0, easeOut);
  const descOpacity  = remap(lf, 68, 96, 0, 1);
  const dotOpacity   = remap(lf, 85, 110, 0, 1);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Screenshot (Ken-Burns centered)
  ctx.save();
  ctx.globalAlpha = c01(opacity);
  const dw = W * scale, dh = H * scale;
  ctx.drawImage(featImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();

  // Vignette
  ctx.save();
  ctx.globalAlpha = c01(opacity);
  const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.28, W / 2, H / 2, W * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Bottom gradient panel
  if (panelOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = c01(panelOpacity);
    const g = ctx.createLinearGradient(0, H * 0.33, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Text block
  if (titleOpacity > 0) {
    const baseY = H - 56;

    // Accent line
    ctx.save();
    ctx.globalAlpha = c01(titleOpacity);
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(64, baseY - 98, c01(accentW / 52) * 52, 3, 1.5);
    ctx.fill();
    ctx.restore();

    // Label
    ctx.save();
    ctx.globalAlpha = c01(titleOpacity);
    ctx.textAlign = 'left';
    ctx.fillStyle = accentColor;
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillText(`FEATURE ${featureIndex + 1} / ${totalFeatures}`, 64, baseY - 70);
    ctx.restore();

    // Title
    ctx.save();
    ctx.globalAlpha = c01(titleOpacity);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '800 48px Inter, system-ui, sans-serif';
    ctx.fillText(feature.title, 64 + titleX, baseY - 22, W - 128);
    ctx.restore();

    // Description
    const shortDesc = feature.description.length > 110
      ? feature.description.slice(0, 110) + '…'
      : feature.description;
    if (shortDesc && descOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = c01(descOpacity * 0.68);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = '400 20px Inter, system-ui, sans-serif';
      ctx.fillText(shortDesc, 64, baseY + 26, W - 128);
      ctx.restore();
    }
  }

  // Progress dots
  if (dotOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = c01(dotOpacity);
    let dotX = W - 48 - totalFeatures * 14;
    for (let d = 0; d < totalFeatures; d++) {
      const isActive = d === featureIndex;
      ctx.fillStyle = isActive ? accentColor : 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.roundRect(dotX, 32, isActive ? 20 : 6, 6, 3);
      ctx.fill();
      dotX += isActive ? 28 : 14;
    }
    ctx.restore();
  }
}

function drawOutro(
  ctx: CanvasRenderingContext2D,
  fullImg: HTMLImageElement,
  lf: number,
  brandName: string,
  siteUrl: string,
  accentColor: string,
) {
  const opacity        = remap(lf, 0, 20, 0, 1);
  const scale          = remap(lf, 0, OUTRO_FRAMES, 1.06, 1.0, easeOut);
  const overlayAlpha   = remap(lf, 0, 45, 0, 0.91, easeOut);
  const contentOpacity = remap(lf, 32, 72, 0, 1);
  const contentY       = remap(lf, 32, 72, 26, 0, easeOut);
  const barW           = remap(lf, 60, 88, 0, 80, easeOut);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = c01(opacity);
  const dw = W * scale, dh = H * scale;
  ctx.drawImage(fullImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();

  if (overlayAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = c01(overlayAlpha);
    ctx.fillStyle = 'rgba(5,5,20,1)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (contentOpacity > 0) {
    const cy = H / 2 + contentY;
    ctx.save();
    ctx.globalAlpha = c01(contentOpacity);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '800 80px Inter, system-ui, sans-serif';
    ctx.fillText(brandName || 'Brand Name', W / 2, cy - 20, W - 96);

    if (siteUrl) {
      ctx.font = '400 21px Inter, system-ui, sans-serif';
      ctx.globalAlpha = c01(contentOpacity * 0.52);
      ctx.fillText(siteUrl.toUpperCase(), W / 2, cy + 32, W - 96);
    }

    ctx.globalAlpha = c01(contentOpacity);
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(W / 2 - barW / 2, cy + (siteUrl ? 62 : 36), barW, 4, 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Public export function ─────────────────────────────────────────────────────

export interface ExportOptions {
  analysis: PageAnalysis;
  features: Feature[]; // may differ from analysis.features (user may edit/delete)
  brandName: string;
  siteUrl: string;
  accentColor: string;
  onProgress?: (progress: number) => void;
  shouldCancel?: () => boolean;
}

export async function exportVideo({
  analysis,
  features,
  brandName,
  siteUrl,
  accentColor,
  onProgress,
  shouldCancel,
}: ExportOptions): Promise<Blob> {
  // Wait for fonts to be ready so canvas text renders correctly
  await document.fonts.ready;

  // Pre-load all images
  const [fullImg, ...featImgs] = await Promise.all([
    loadImg(analysis.fullScreenshot),
    ...features.map((f) => loadImg(f.screenshot)),
  ]);

  const totalFrames = calcTotalFrames(features.length);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(100);

  for (let frame = 0; frame < totalFrames; frame++) {
    if (shouldCancel?.()) {
      recorder.stop();
      throw new Error('Export cancelled');
    }

    // Determine scene
    if (frame < INTRO_FRAMES) {
      drawIntro(ctx, fullImg, frame, brandName, accentColor);
    } else {
      const afterIntro = frame - INTRO_FRAMES;
      if (afterIntro < features.length * FEATURE_FRAMES) {
        const fi = Math.floor(afterIntro / FEATURE_FRAMES);
        const lf = afterIntro % FEATURE_FRAMES;
        drawFeature(ctx, featImgs[fi], lf, features[fi], fi, features.length, accentColor);
      } else {
        const lf = afterIntro - features.length * FEATURE_FRAMES;
        drawOutro(ctx, fullImg, lf, brandName, siteUrl, accentColor);
      }
    }

    onProgress?.(frame / totalFrames);
    await new Promise<void>((r) => setTimeout(r, 1000 / FPS));
  }

  recorder.stop();
  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
}
