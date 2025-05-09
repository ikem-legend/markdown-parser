"use client";

import { useEffect, useState } from 'react';
import { useMarkdownStore } from '../store/markdownStore';

const MarkdownEditorPane = () => {
  const { content, setContent } = useMarkdownStore();
  // Use local state for hydration safety
  const [localContent, setLocalContent] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    setLocalContent(content);
  }, [content]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setContent(newContent);
  };

  return (
    <div className="flex-1 min-h-[400px] md:h-[calc(100vh-10rem)]">
      <textarea
        className="w-full h-full p-4 border border-gray-300 rounded-md font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
        value={isHydrated ? localContent : ''}
        onChange={handleInputChange}
        placeholder="Type your markdown here..."
      />
    </div>
  );
};

export default MarkdownEditorPane; 