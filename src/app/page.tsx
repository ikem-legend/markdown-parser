'use client';

import dynamic from 'next/dynamic';

// Import with no SSR to prevent hydration issues
const MarkdownEditor = dynamic(() => import('./components/MarkdownEditor'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 flex items-center justify-center">
      <div className="animate-pulse text-xl">Loading Markdown Editor...</div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-2">Markdown Editor</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Type markdown on the left, see the preview on the right. Export to PDF or copy to clipboard.
          </p>
        </header>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6">
          <MarkdownEditor />
        </div>
      </div>
    </main>
  );
}
