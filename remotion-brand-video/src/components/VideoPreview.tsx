import { useState } from 'react';
import { Player } from '@remotion/player';
import type { PageData } from '../App';
import { BrandVideo } from '../remotion/BrandVideo';
import { exportVideo } from '../utils/exportVideo';

interface Props {
  pageData: PageData;
  onReset: () => void;
}

export function VideoPreview({ pageData, onReset }: Props) {
  const [brandName, setBrandName] = useState(pageData.sourceName);
  const [siteUrl, setSiteUrl] = useState('');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState('');

  async function handleExport() {
    setExporting(true);
    setProgress(0);
    setExportError('');

    try {
      const blob = await exportVideo({
        screenshot: pageData.screenshot,
        brandName,
        siteUrl,
        onProgress: setProgress,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(brandName || 'brand').replace(/\s+/g, '-').toLowerCase()}-reel.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }

  const pct = Math.round(progress * 100);

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
        <span className="text-xs text-gray-600 tabular-nums">1280 × 720 · 30 fps · 10 s</span>
      </div>

      {/* Remotion Player */}
      <div className="rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-2xl">
        <Player
          component={BrandVideo}
          compositionWidth={1280}
          compositionHeight={720}
          durationInFrames={300}
          fps={30}
          inputProps={{ screenshot: pageData.screenshot, brandName, siteUrl }}
          style={{ width: '100%' }}
          controls
          loop
          autoPlay
        />
      </div>

      {/* Brand inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-1.5">
            Brand Name
          </span>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Acme Inc."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-1.5">
            Website / Tagline
          </span>
          <input
            type="text"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="acme.com"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </label>
      </div>

      {/* Export button */}
      <div className="pt-1">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="relative w-full overflow-hidden bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4 transition-colors"
        >
          {/* Progress fill */}
          {exporting && (
            <span
              className="absolute inset-y-0 left-0 bg-indigo-400/30 transition-all duration-150"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
          )}

          <span className="relative z-10 flex items-center justify-center gap-2.5">
            {exporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/70 border-t-white rounded-full animate-spin" />
                Rendering… {pct}%
              </>
            ) : (
              <>
                <span>Export Video</span>
                <span className="text-indigo-300 font-normal text-sm">.webm</span>
              </>
            )}
          </span>
        </button>

        {exportError && (
          <p className="mt-2 text-red-400 text-sm text-center">{exportError}</p>
        )}

        <p className="mt-2 text-xs text-gray-700 text-center">
          Renders locally in ~10 seconds · No upload · Downloads as .webm
        </p>
      </div>
    </div>
  );
}
