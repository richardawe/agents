// ── Scene timing constants (shared by Remotion components and canvas exporter) ─

export const FPS = 30;
export const INTRO_FRAMES = 90;   // 3 s
export const FEATURE_FRAMES = 150; // 5 s per feature
export const OUTRO_FRAMES = 90;   // 3 s

export function calcTotalFrames(featureCount: number): number {
  return INTRO_FRAMES + featureCount * FEATURE_FRAMES + OUTRO_FRAMES;
}

export function calcDurationSecs(featureCount: number): number {
  return Math.round(calcTotalFrames(featureCount) / FPS);
}

// ── Data shapes ────────────────────────────────────────────────────────────────

export interface Feature {
  id: string;
  title: string;
  description: string;
  screenshot: string; // 1280×720 JPEG data URL
  scrollY: number;
}

export interface PageAnalysis {
  fullScreenshot: string; // above-the-fold 1280×720
  title: string;
  description: string;
  features: Feature[];
  accentColor: string; // extracted from page buttons/links, e.g. "#6366f1"
}
