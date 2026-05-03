import { useRef, useState } from 'react';
import { Player } from '@remotion/player';
import type { PageData } from '../App';
import type { Feature } from '../types';
import { BrandVideo } from '../remotion/BrandVideo';
import { FeatureEditor } from './FeatureEditor';
import { exportVideo } from '../utils/exportVideo';
import { calcDurationSecs, calcTotalFrames } from '../types';

interface Props {
  pageData: PageData;
  onReset: () => void;
}

const ACCENT_PRESETS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#f59e0b', // amber
  '#ef4444', // red
];

export function VideoPreview({ pageData, onReset }: Props) {
  const { analysis, sourceName } = pageData;

  const [brandName, setBrandName]   = useState(analysis.title || sourceName);
  const [siteUrl, setSiteUrl]       = useState('');
  const [accentColor, setAccentColor] = useState(analysis.accentColor);
  const [features, setFeatures]     = useState<Feature[]>(analysis.features);
  const [showFeatures, setShowFeatures] = useState(true);

  const [exporting, setExporting]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [exportError, setExportError] = useState('');
  const cancelRef = useRef(false);

  const totalFrames   = calcTotalFrames(features.length);
  const durationSecs  = calcDurationSecs(features.length);
  const pct           = Math.round(progress * 100);

  async function handleExport() {
    setExporting(true);
    setProgress(0);
    setExportError('');
    cancelRef.current = false;

    try {
      const blob = await exportVideo({
        analysis,
        features,
        brandName,
        siteUrl,
        accentColor,
        onProgress: setProgress,
        shouldCancel: () => cancelRef.current,
      });

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${(brandName || 'brand').replace(/\s+/g, '-').toLowerCase()}-reel.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if ((err as Error).message !== 'Export cancelled') {
        setExportError((err as Error).message || 'Export failed');
      }
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }

  function handleCancel() {
    cancelRef.current = true;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span aria-hidden>←</span> Start over
        </button>
        <span className="text-xs text-gray-600 tabular-nums">
          1280 × 720 · 30 fps · {durationSecs} s
          {features.length > 0 && (
            <span className="ml-2 text-gray-700">
              ({features.length} feature{features.length !== 1 ? 's' : ''})
            </span>
          )}
        </span>
      </div>

      {/* Remotion Player — re-keyed when feature count changes so durationInFrames syncs */}
      <div className="rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-2xl">
        <Player
          key={`player-${features.length}-${accentColor}`}
          component={BrandVideo}
          compositionWidth={1280}
          compositionHeight={720}
          durationInFrames={totalFrames}
          fps={30}
          inputProps={{ fullScreenshot: analysis.fullScreenshot, features, brandName, siteUrl, accentColor }}
          style={{ width: '100%' }}
          controls
          loop
          autoPlay
        />
      </div>

      {/* Brand metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-1.5">Brand Name</span>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Acme Inc."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-1.5">Website / Tagline</span>
          <input
            type="text"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="acme.com"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </label>
      </div>

      {/* Accent colour */}
      <div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-2">Accent Colour</span>
        <div className="flex items-center gap-2 flex-wrap">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setAccentColor(c)}
              title={c}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: accentColor === c ? '#fff' : 'transparent',
              }}
            />
          ))}
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
            />
            Custom
          </label>
        </div>
      </div>

      {/* Feature editor */}
      <div className="border border-gray-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowFeatures((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-900/60 hover:bg-gray-900 transition-colors text-left"
        >
          <span className="text-sm font-medium">
            Detected Features
            <span className="ml-2 text-xs text-gray-500 font-normal">
              {features.length === 0 ? 'none found' : `${features.length} section${features.length !== 1 ? 's' : ''} · edit, reorder or remove`}
            </span>
          </span>
          <span className="text-gray-500 text-xs">{showFeatures ? '▲' : '▼'}</span>
        </button>

        {showFeatures && (
          <div className="p-4">
            <FeatureEditor features={features} onChange={setFeatures} />
          </div>
        )}
      </div>

      {/* Export */}
      <div className="pt-1">
        {exporting ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden bg-indigo-700 rounded-xl py-4">
              <span
                className="absolute inset-y-0 left-0 bg-indigo-500/40 transition-all duration-100"
                style={{ width: `${pct}%` }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2.5 text-white font-semibold">
                <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                Rendering… {pct}% — {Math.round(durationSecs * (1 - progress))} s left
              </span>
            </div>
            <button
              onClick={handleCancel}
              className="w-full border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-sm rounded-xl py-2.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleExport}
            className="relative w-full overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-4 transition-colors"
          >
            <span className="flex items-center justify-center gap-2.5">
              Export Video
              <span className="text-indigo-300 font-normal text-sm">.webm · {durationSecs} s</span>
            </span>
          </button>
        )}

        {exportError && (
          <p className="mt-2 text-red-400 text-sm text-center">{exportError}</p>
        )}

        <p className="mt-2 text-xs text-gray-700 text-center">
          Renders locally in ~{durationSecs} s · No upload · Downloads as .webm
        </p>
      </div>
    </div>
  );
}
