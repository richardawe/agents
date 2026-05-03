import { useRef, useState } from 'react';
import type { PageData } from '../App';
import { analyzeHtmlFile, imageAnalysisFromFile } from '../utils/analyzeHtml';

interface Props {
  onCapture: (data: PageData) => void;
}

const ACCEPTED = '.html,image/png,image/jpeg,image/webp,image/gif';

export function UploadForm({ onCapture }: Props) {
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [step, setStep]           = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setLoading(true);
    setStep(0);
    setTotalSteps(0);

    try {
      let sourceName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

      if (file.type.startsWith('image/')) {
        setLoadingMsg('Reading image…');
        const analysis = await imageAnalysisFromFile(file);
        onCapture({ analysis, sourceName });
      } else if (file.name.endsWith('.html') || file.type === 'text/html') {
        // Parse the HTML step-count from "Capturing section N of M"
        const analysis = await analyzeHtmlFile(file, (msg) => {
          setLoadingMsg(msg);
          const m = msg.match(/Capturing section (\d+) of (\d+)/);
          if (m) {
            setStep(Number(m[1]));
            setTotalSteps(Number(m[2]));
          }
        });
        sourceName = analysis.title || sourceName;
        onCapture({ analysis, sourceName });
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-medium tracking-widest uppercase mb-4 bg-indigo-400/10 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          Powered by Remotion
        </div>
        <h2 className="text-5xl font-extrabold tracking-tight mb-4 leading-tight">
          Turn your webpage into<br />a brand reel
        </h2>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Upload an HTML file and we'll detect your key features, then animate each one into a polished brand video
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload file"
        className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer select-none outline-none
          ${dragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900/40'
          }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !loading && fileRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !loading && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={onFileChange}
        />

        {loading ? (
          <div className="space-y-5">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-200 font-medium">{loadingMsg || 'Analyzing…'}</p>

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

            <p className="text-gray-600 text-sm">Please wait — this can take 10–30 seconds</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl">
              +
            </div>
            <p className="text-lg font-semibold text-gray-100 mb-1">Drop your file here</p>
            <p className="text-sm text-gray-500 mb-5">or click to browse</p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
              <span className="bg-gray-800 px-2 py-1 rounded">.html</span>
              <span className="bg-gray-800 px-2 py-1 rounded">.png</span>
              <span className="bg-gray-800 px-2 py-1 rounded">.jpg</span>
              <span className="bg-gray-800 px-2 py-1 rounded">.webp</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-700 text-center">
        Everything runs in your browser — no files are uploaded to any server
      </p>
    </div>
  );
}
