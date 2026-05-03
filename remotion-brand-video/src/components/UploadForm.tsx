import { useRef, useState } from 'react';
import type { PageData } from '../App';
import { analyzeHtmlFile, imageAnalysisFromFile } from '../utils/analyzeHtml';
import { fetchUrlAsHtml, normalizeUrl } from '../utils/fetchUrl';

interface Props {
  onCapture: (data: PageData) => void;
}

type Tab = 'file' | 'url';

const ACCEPTED = '.html,image/png,image/jpeg,image/webp,image/gif';

export function UploadForm({ onCapture }: Props) {
  const [tab, setTab]             = useState<Tab>('url');
  const [urlInput, setUrlInput]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [step, setStep]           = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Shared analysis pipeline ──────────────────────────────────────────────

  async function analyzeFile(file: File, fallbackName: string) {
    const analysis = await analyzeHtmlFile(file, (msg) => {
      setLoadingMsg(msg);
      const m = msg.match(/Capturing section (\d+) of (\d+)/);
      if (m) { setStep(Number(m[1])); setTotalSteps(Number(m[2])); }
    });
    const sourceName = analysis.title || fallbackName;
    onCapture({ analysis, sourceName });
  }

  // ── URL flow ──────────────────────────────────────────────────────────────

  async function handleUrl(raw: string) {
    const url = normalizeUrl(raw);
    setError('');
    setLoading(true);
    setStep(0);
    setTotalSteps(0);

    try {
      setLoadingMsg('Fetching page…');
      const html = await fetchUrlAsHtml(url);

      setLoadingMsg('Loading your page…');
      const blob = new Blob([html], { type: 'text/html' });
      const file = new File([blob], 'page.html', { type: 'text/html' });

      // Derive a friendly name from the hostname
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      await analyzeFile(file, hostname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMsg('');
      setStep(0);
    }
  }

  function onUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (urlInput.trim()) handleUrl(urlInput.trim());
  }

  // ── File flow ─────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setError('');
    setLoading(true);
    setStep(0);
    setTotalSteps(0);

    try {
      const fallbackName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      if (file.type.startsWith('image/')) {
        setLoadingMsg('Reading image…');
        const analysis = await imageAnalysisFromFile(file);
        onCapture({ analysis, sourceName: analysis.title || fallbackName });
      } else if (file.name.endsWith('.html') || file.type === 'text/html') {
        setLoadingMsg('Loading your page…');
        await analyzeFile(file, fallbackName);
      } else {
        throw new Error('Please upload an HTML file or an image (PNG, JPG, WebP)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMsg('');
      setStep(0);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  const progressPct = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-medium tracking-widest uppercase mb-4 bg-indigo-400/10 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          Powered by Remotion
        </div>
        <h2 className="text-5xl font-extrabold tracking-tight mb-4 leading-tight">
          Turn your webpage into<br />a brand reel
        </h2>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Paste a URL or upload an HTML file — we'll detect your key features and animate them into a polished brand video
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-xl mb-5">
        {(['url', 'file'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t
                ? 'bg-gray-700 text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'url' ? 'Paste a URL' : 'Upload HTML / Image'}
          </button>
        ))}
      </div>

      {/* Loading overlay (shared) */}
      {loading ? (
        <div className="border-2 border-gray-800 rounded-2xl p-16 text-center space-y-5">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-200 font-medium">{loadingMsg || 'Working…'}</p>

          {progressPct !== null && (
            <div className="max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Section {step} of {totalSteps}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-gray-600 text-sm">This can take 10–30 seconds</p>
        </div>

      ) : tab === 'url' ? (
        /* ── URL input ─────────────────────────────────────────────────── */
        <form onSubmit={onUrlSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-brand.com"
              autoFocus
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Generate
            </button>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-400">How it works</p>
            <p>We fetch the page through a CORS proxy, inject it into a sandboxed renderer, then detect and screenshot each key section — the same pipeline as uploading an HTML file.</p>
            <p className="text-gray-600">Sites that block external requests may not load correctly. In that case, save the page as HTML and use the Upload tab.</p>
          </div>
        </form>

      ) : (
        /* ── File drop zone ────────────────────────────────────────────── */
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload file"
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer select-none outline-none ${
            dragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={onFileChange}
          />
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl">+</div>
          <p className="text-lg font-semibold text-gray-100 mb-1">Drop your file here</p>
          <p className="text-sm text-gray-500 mb-5">or click to browse</p>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
            {['.html', '.png', '.jpg', '.webp'].map((ext) => (
              <span key={ext} className="bg-gray-800 px-2 py-1 rounded">{ext}</span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-700 text-center">
        Everything runs in your browser — no files are uploaded to any server
      </p>
    </div>
  );
}
