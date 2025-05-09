import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MarkdownState {
  content: string;
  setContent: (content: string) => void;
  resetToDefault: () => void;
}

const defaultContent = `# Hello, Markdown!

Type your markdown here and see it rendered in real-time.

## Features

- Real-time preview
- Export to PDF
- Copy to clipboard

\`\`\`js
console.log("This is a code block");
\`\`\``;

// Create a store with persistence
export const useMarkdownStore = create<MarkdownState>()(
  persist(
    (set) => ({
      content: defaultContent,
      setContent: (content: string) => set({ content }),
      resetToDefault: () => set({ content: defaultContent }),
    }),
    {
      name: 'markdown-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ content: state.content }),
      version: 1,
    }
  )
);

// Add an initialization function to check for empty content on load
export const initializeStore = () => {
  const { content, resetToDefault } = useMarkdownStore.getState();
  
  // If content is empty or just whitespace, reset to default
  if (!content || content.trim() === '') {
    console.log('No content found, using default content');
    resetToDefault();
  }
}; 