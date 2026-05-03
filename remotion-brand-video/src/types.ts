// ── Scene timing constants ─────────────────────────────────────────────────────

export const FPS = 30;
export const INTRO_FRAMES   = 90;   // 3 s
export const FEATURE_FRAMES = 150;  // 5 s per feature
export const OUTRO_FRAMES   = 90;   // 3 s

export function calcTotalFrames(featureCount: number): number {
  return INTRO_FRAMES + featureCount * FEATURE_FRAMES + OUTRO_FRAMES;
}

export function calcDurationSecs(featureCount: number): number {
  return Math.round(calcTotalFrames(featureCount) / FPS);
}

// ── Video output dimensions (9:16 portrait / mobile) ─────────────────────────

export const VIDEO_W = 1080;
export const VIDEO_H = 1920;

// ── Capture viewport (mobile) ─────────────────────────────────────────────────

export const CAP_W = 390;  // iframe / screenshot width
export const CAP_H = 844;  // iframe / screenshot height

// ── Data shapes ────────────────────────────────────────────────────────────────

export interface Feature {
  id: string;
  title: string;
  description: string;
  screenshot: string; // CAP_W × CAP_H JPEG data URL
  scrollY: number;
}

export interface PageAnalysis {
  fullScreenshot: string;
  title: string;
  description: string;
  features: Feature[];
  accentColor: string;
}
