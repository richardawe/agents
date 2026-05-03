import { useState } from 'react';
import { UploadForm } from './components/UploadForm';
import { VideoPreview } from './components/VideoPreview';

export interface PageData {
  screenshot: string;
  sourceName: string;
}

export default function App() {
  const [pageData, setPageData] = useState<PageData | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <header className="border-b border-gray-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">
              B
            </div>
            <span className="font-bold tracking-tight">Brand Reel</span>
          </div>
          <a
            href="https://www.remotion.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Built with Remotion
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {pageData ? (
          <VideoPreview pageData={pageData} onReset={() => setPageData(null)} />
        ) : (
          <UploadForm onCapture={setPageData} />
        )}
      </main>
    </div>
  );
}
