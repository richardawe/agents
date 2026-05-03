import { useRef, useState } from 'react';
import type { PageData } from '../App';
import { captureFromHtml, captureFromImage } from '../utils/capture';

interface Props {
  onCapture: (data: PageData) => void;
}

const ACCEPTED = '.html,image/png,image/jpeg,image/webp,image/gif';

export function UploadForm({ onCapture }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setLoading(true);

    try {
      let screenshot: string;

      if (file.type.startsWith('image/')) {
        setLoadingMsg('Reading image…');
        screenshot = await captureFromImage(file);
      } else if (file.name.endsWith('.html') || file.type === 'text/html') {
        setLoadingMsg('Rendering your page…');
        screenshot = await captureFromHtml(file);
      } else {
        throw new Error('Upload an HTML file or an image (PNG, JPG, WebP)');
      }

      const sourceName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      onCapture({ screenshot, sourceName });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMsg('');
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
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

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
          Upload an HTML file or a screenshot — we'll animate it into a polished 10-second video
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

        {loading ? (
          <div className="space-y-4">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-300 font-medium">{loadingMsg}</p>
            <p className="text-gray-600 text-sm">This may take a few seconds</p>
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
