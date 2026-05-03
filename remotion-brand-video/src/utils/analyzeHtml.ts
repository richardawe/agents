import html2canvas from 'html2canvas';
import type { Feature, PageAnalysis } from '../types';

const W = 1280;
const H = 720;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Screenshot ─────────────────────────────────────────────────────────────────

async function captureAtY(doc: Document, y: number): Promise<string> {
  const canvas = await html2canvas(doc.documentElement, {
    y,
    height: H,
    width: W,
    windowWidth: W,
    windowHeight: H,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scale: 1,
  });
  return canvas.toDataURL('image/jpeg', 0.88);
}

// ── Color extraction ───────────────────────────────────────────────────────────

function rgbToHex(rgb: string): string | null {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return null;
  const [, r, g, b] = m.map(Number);
  if (r > 235 && g > 235 && b > 235) return null; // near-white
  if (r < 20 && g < 20 && b < 20) return null;    // near-black
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function extractAccentColor(doc: Document, win: Window): string {
  const FALLBACK = '#6366f1';
  const buttonSelectors = ['button', '[class*="btn"]', '[class*="cta"]', '[class*="button"]'];
  for (const sel of buttonSelectors) {
    for (const el of Array.from(doc.querySelectorAll(sel)).slice(0, 8)) {
      const bg = win.getComputedStyle(el).backgroundColor;
      if (bg && !bg.includes('0, 0, 0, 0') && bg !== 'transparent') {
        const hex = rgbToHex(bg);
        if (hex) return hex;
      }
    }
  }
  for (const a of Array.from(doc.querySelectorAll('a')).slice(0, 10)) {
    const color = win.getComputedStyle(a).color;
    if (color) {
      const hex = rgbToHex(color);
      if (hex) return hex;
    }
  }
  return FALLBACK;
}

// ── Feature detection ──────────────────────────────────────────────────────────

const SELECTORS = [
  '[class*="hero"]',
  '[class*="feature"]:not(script):not(style)',
  '[class*="benefit"]',
  '[class*="how"]',
  '[class*="pricing"]',
  '[class*="testimonial"]',
  '[class*="step"]',
  '[class*="about"]',
  '[class*="faq"]',
  'main > section',
  'body > section',
  '[class*="section"]',
];

function extractDescription(el: Element, max = 160): string {
  const snippets = Array.from(el.querySelectorAll('p, li'))
    .slice(0, 3)
    .map((n) => n.textContent?.trim())
    .filter(Boolean);
  const joined = snippets.join(' ');
  return joined.length ? joined.slice(0, max) : (el.textContent?.trim() ?? '').slice(0, max);
}

interface SectionCandidate {
  title: string;
  description: string;
  scrollY: number;
}

function detectSections(doc: Document, win: Window, pageH: number): SectionCandidate[] {
  const seenBucket = new Set<number>();
  const results: SectionCandidate[] = [];

  for (const selector of SELECTORS) {
    let els: Element[];
    try { els = Array.from(doc.querySelectorAll(selector)); }
    catch { continue; }

    for (const el of els) {
      const rect = el.getBoundingClientRect();
      const absTop = rect.top + win.scrollY;

      if (rect.height < 150 || rect.width < 300) continue;
      if (absTop < 80) continue;        // skip top nav / header
      if (absTop > pageH - 100) continue; // skip footer

      // Deduplicate within 100px buckets
      const bucket = Math.round(absTop / 100);
      if (seenBucket.has(bucket)) continue;
      seenBucket.add(bucket);

      const heading = el.querySelector('h1, h2, h3, h4');
      const title = heading?.textContent?.trim() ?? '';
      if (!title) continue;

      results.push({
        title,
        description: extractDescription(el),
        scrollY: Math.max(0, absTop - 60),
      });
      if (results.length >= 5) return results;
    }
  }

  // Interval fallback when too few sections detected
  if (results.length < 2) {
    for (let y = H; y < pageH - 200 && results.length < 4; y += H) {
      const bucket = Math.round(y / 100);
      if (!seenBucket.has(bucket)) {
        seenBucket.add(bucket);
        results.push({ title: `Section ${results.length + 1}`, description: '', scrollY: y });
      }
    }
  }

  return results.slice(0, 5);
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function analyzeHtmlFile(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<PageAnalysis> {
  const blobUrl = URL.createObjectURL(file);
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1280px;height:720px;border:none;visibility:hidden;pointer-events:none;';
  document.body.appendChild(iframe);

  try {
    onProgress?.('Loading your page…');
    iframe.src = blobUrl;
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('Failed to load HTML file'));
      setTimeout(() => reject(new Error('Timed out loading HTML (20 s)')), 20_000);
    });
    await delay(1300); // settle fonts, JS, images

    const doc = iframe.contentDocument!;
    const win = iframe.contentWindow!;

    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.title ||
      file.name.replace(/\.[^.]+$/, '');

    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      '';

    const accentColor = extractAccentColor(doc, win);

    onProgress?.('Capturing hero section…');
    const fullScreenshot = await captureAtY(doc, 0);

    onProgress?.('Analyzing page sections…');
    const pageH = doc.documentElement.scrollHeight;
    const sections = detectSections(doc, win, pageH);

    const features: Feature[] = [];
    for (let i = 0; i < sections.length; i++) {
      onProgress?.(`Capturing section ${i + 1} of ${sections.length}…`);
      const { title: secTitle, description: secDesc, scrollY } = sections[i];
      const screenshot = await captureAtY(doc, scrollY);
      features.push({ id: `feat-${i}`, title: secTitle, description: secDesc, screenshot, scrollY });
    }

    return { fullScreenshot, title, description, features, accentColor };
  } finally {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(blobUrl);
  }
}

export function imageAnalysisFromFile(file: File): Promise<PageAnalysis> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const screenshot = e.target!.result as string;
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      resolve({
        fullScreenshot: screenshot,
        title: name,
        description: '',
        features: [],
        accentColor: '#6366f1',
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}
