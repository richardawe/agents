import type { Feature, PageAnalysis } from '../types';
import {
  calcTotalFrames,
  FEATURE_FRAMES,
  FPS,
  INTRO_FRAMES,
  VIDEO_W,
  VIDEO_H,
} from '../types';

const W = VIDEO_W; // 1080
const H = VIDEO_H; // 1920

// ── Easing / math helpers ──────────────────────────────────────────────────────

function c01(t: number) { return Math.min(1, Math.max(0, t)); }

function remap(v: number, i0: number, i1: number, o0: number, o1: number, ease?: (t: number) => number): number {
  const t = (v - i0) / (i1 - i0);
  const e = ease ? ease(t) : t;
  return o0 + (o1 - o0) * c01(e);
}

const easeOut   = (t: number) => 1 - Math.pow(1 - c01(t), 3);
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

// ── Cover-scale draw helper ────────────────────────────────────────────────────
// Scales img to fill the W×H canvas (like objectFit:cover), anchored to top or center.

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  zoomScale = 1.0,
  anchorTop = false,
) {
  const base = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const s  = base * zoomScale;
  const dw = img.naturalWidth  * s;
  const dh = img.naturalHeight * s;
  const dx = (W - dw) / 2;
  const dy = anchorTop ? 0 : (H - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ── Scene draw functions ───────────────────────────────────────────────────────

function drawIntro(
  ctx: CanvasRenderingContext2D,
  fullImg: HTMLImageElement,
  lf: number,
  brandName: string,
  accentColor: string,
) {
  const opacity      = remap(lf, 0, 20, 0, 1);
  const scale        = remap(lf, 20, 90, 1.0, 1.08, easeSine);
  const titleOpacity = remap(lf, 55, 85, 0, 1);
  const titleY       = remap(lf, 55, 85, Math.round(H * 0.015), 0, easeOut);

  const fontSize  = Math.round(W * 0.1);    // 108
  const barW      = Math.round(W * 0.1);    // 108
  const bottomPad = Math.round(H * 0.055);  // 106

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = c01(opacity);
  drawCover(ctx, fullImg, scale, true);
  ctx.restore();

  // Bottom gradient
  ctx.save();
  ctx.globalAlpha = c01(opacity);
  const g = ctx.createLinearGradient(0, H * 0.45, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  if (titleOpacity > 0) {
    const nameY  = H - bottomPad + titleY;
    const barTopY = nameY + Math.round(H * 0.01);

    ctx.save();
    ctx.globalAlpha = c01(titleOpacity);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(brandName || 'Brand Name', W / 2, nameY, W - Math.round(W * 0.12));
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(W / 2 - barW / 2, barTopY, barW, 4, 2);
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
  const accentW      = remap(lf, 42, 82, 0, Math.round(W * 0.09), easeOut);
  const titleOpacity = remap(lf, 48, 78, 0, 1);
  const titleX       = remap(lf, 48, 78, -Math.round(W * 0.03), 0, easeOut);
  const descOpacity  = remap(lf, 68, 96, 0, 1);
  const dotOpacity   = remap(lf, 85, 110, 0, 1);

  const hasText  = !!feature.title;
  const padH     = Math.round(W * 0.059); // 64
  const titleSize = Math.round(W * 0.088); // 95
  const labelSize = Math.round(W * 0.026); // 28
  const descSize  = Math.round(W * 0.042); // 45

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Screenshot
  ctx.save();
  ctx.globalAlpha = c01(opacity);
  drawCover(ctx, featImg, scale, false);
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
    const g = ctx.createLinearGradient(0, H * 0.65, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Text block (bottom-anchored)
  if (titleOpacity > 0) {
    const descBaseline  = H - Math.round(H * 0.04);
    const titleBaseline = descBaseline - Math.round(descSize * 1.5) - Math.round(H * 0.008);
    const labelBaseline = titleBaseline - Math.round(titleSize * 1.2) - Math.round(H * 0.007);
    const accentTopY    = labelBaseline - labelSize - Math.round(H * 0.012);

    // Accent line
    ctx.save();
    ctx.globalAlpha = c01(titleOpacity);
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(padH, accentTopY, accentW, 4, 2);
    ctx.fill();
    ctx.restore();

    // Label
    ctx.save();
    ctx.globalAlpha = c01(titleOpacity);
    ctx.textAlign = 'left';
    ctx.fillStyle = accentColor;
    ctx.font = `600 ${labelSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(
      hasText ? `FEATURE ${featureIndex + 1} / ${totalFeatures}` : `SECTION ${featureIndex + 1}`,
      padH,
      labelBaseline,
    );
    ctx.restore();

    // Title
    if (hasText) {
      ctx.save();
      ctx.globalAlpha = c01(titleOpacity);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${titleSize}px Inter, system-ui, sans-serif`;
      ctx.fillText(feature.title, padH + titleX, titleBaseline, W - padH * 2);
      ctx.restore();
    }

    // Description
    const shortDesc = feature.description.length > 100
      ? feature.description.slice(0, 100) + '…'
      : feature.description;
    if (hasText && shortDesc && descOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = c01(descOpacity * 0.68);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = `400 ${descSize}px Inter, system-ui, sans-serif`;
      ctx.fillText(shortDesc, padH, descBaseline, W - padH * 2);
      ctx.restore();
    }
  }

  // Progress dots (top-center)
  if (dotOpacity > 0) {
    const dotH       = Math.round(W * 0.012); // 13
    const activeDotW = Math.round(W * 0.038); // 41
    const gap        = Math.round(W * 0.018); // 19
    const totalDotW  = totalFeatures * dotH + (totalFeatures - 1) * gap + (activeDotW - dotH);
    let dotX = (W - totalDotW) / 2;
    const dotY = Math.round(H * 0.025);

    ctx.save();
    ctx.globalAlpha = c01(dotOpacity);
    for (let d = 0; d < totalFeatures; d++) {
      const isActive = d === featureIndex;
      const dw = isActive ? activeDotW : dotH;
      ctx.fillStyle = isActive ? accentColor : 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.roundRect(dotX, dotY, dw, dotH, dotH / 2);
      ctx.fill();
      dotX += dw + gap;
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
  const scale          = remap(lf, 0, 90, 1.06, 1.0, easeOut);
  const overlayAlpha   = remap(lf, 0, 45, 0, 0.91, easeOut);
  const contentOpacity = remap(lf, 32, 72, 0, 1);
  const contentY       = remap(lf, 32, 72, Math.round(H * 0.035), 0, easeOut);
  const barW           = remap(lf, 60, 88, 0, Math.round(W * 0.14), easeOut);

  const titleSize = Math.round(W * 0.13);  // 140
  const urlSize   = Math.round(W * 0.038); // 41

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = c01(opacity);
  drawCover(ctx, fullImg, scale, false);
  ctx.restore();

  if (overlayAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = c01(overlayAlpha);
    ctx.fillStyle = 'rgba(5,5,20,1)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (contentOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = c01(contentOpacity);
    ctx.textAlign = 'center';

    const titleY = H / 2 + contentY;
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${titleSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(brandName || 'Brand Name', W / 2, titleY, W - Math.round(W * 0.16));

    let nextY = titleY + Math.round(H * 0.018) + urlSize;
    if (siteUrl) {
      ctx.font = `400 ${urlSize}px Inter, system-ui, sans-serif`;
      ctx.globalAlpha = c01(contentOpacity * 0.5);
      ctx.fillText(siteUrl.toUpperCase(), W / 2, nextY, W - Math.round(W * 0.16));
      nextY += Math.round(H * 0.025);
    } else {
      nextY = titleY + Math.round(H * 0.025);
    }

    ctx.globalAlpha = c01(contentOpacity);
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(W / 2 - barW / 2, nextY, barW, 5, 2.5);
    ctx.fill();
    ctx.restore();
  }
}

// ── Public export function ─────────────────────────────────────────────────────

export interface ExportOptions {
  analysis: PageAnalysis;
  features: Feature[];
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
  await document.fonts.ready;

  const [fullImg, ...featImgs] = await Promise.all([
    loadImg(analysis.fullScreenshot),
    ...features.map((f) => loadImg(f.screenshot)),
  ]);

  const totalFrames = calcTotalFrames(features.length);

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream   = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(100);

  for (let frame = 0; frame < totalFrames; frame++) {
    if (shouldCancel?.()) {
      recorder.stop();
      throw new Error('Export cancelled');
    }

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
