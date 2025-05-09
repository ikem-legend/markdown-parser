"use client";

import { useEffect } from 'react';
import MarkdownEditorPane from './MarkdownEditorPane';
import MarkdownPreviewPane from './MarkdownPreviewPane';
import { initializeStore } from '../store/markdownStore';

const MarkdownEditor = () => {
  // Initialize store when component mounts
  useEffect(() => {
    initializeStore();
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-4">
      <MarkdownEditorPane />
      
      <MarkdownPreviewPane />
    </div>
  );
};

export default MarkdownEditor; 