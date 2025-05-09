"use client";

import { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import { useMarkdownStore } from '../store/markdownStore';
import '../markdownStyles.css';

interface MarkdownPreviewPaneProps {
  className?: string;
}

const MarkdownPreviewPane = ({ className = '' }: MarkdownPreviewPaneProps) => {
  const { content } = useMarkdownStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    setLocalContent(content);
  }, [content]);

  const handleCopy = async () => {
    if (!previewRef.current) return;

    try {
      // Get the HTML content of the preview
      const htmlContent = previewRef.current.innerHTML;
      
      // Create a temporary element to hold the content
      const tempElement = document.createElement('div');
      tempElement.innerHTML = htmlContent;
      
      // Use the Clipboard API to copy HTML content
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([tempElement.innerHTML], { type: 'text/html' }),
          'text/plain': new Blob([previewRef.current.innerText], { type: 'text/plain' })
        })
      ]);
      
      alert('Content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy: ', error);
      alert('Failed to copy content.');
    }
  };

  const handleExport = () => {
    if (!previewRef.current) return;

    try {
      // Create a new PDF in portrait orientation with mm units on A4 paper
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Use the raw markdown content directly for the PDF
      const lines = localContent.split('\n');
      let y = 20; // Starting y position
      const lineHeight = 7;
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const maxWidth = pageWidth - (margin * 2);
      
      // Add a title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      const title = "Markdown Export";
      pdf.text(title, margin, y);
      y += lineHeight + 5;
      
      // Process each line of markdown content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      lines.forEach(line => {
        // Handle headings (very basic)
        if (line.startsWith('# ')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
          pdf.text(line.substring(2), margin, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          y += lineHeight + 3;
        }
        else if (line.startsWith('## ')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.text(line.substring(3), margin, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          y += lineHeight + 2;
        }
        else if (line.startsWith('### ')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(line.substring(4), margin, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          y += lineHeight + 1;
        }
        // Handle lists (very basic)
        else if (line.startsWith('- ')) {
          const textWidth = pdf.getStringUnitWidth(line) * pdf.getFontSize() / pdf.internal.scaleFactor;
          if (textWidth > maxWidth) {
            const words = line.split(' ');
            let currentLine = '';
            words.forEach(word => {
              const testLine = currentLine + word + ' ';
              const testWidth = pdf.getStringUnitWidth(testLine) * pdf.getFontSize() / pdf.internal.scaleFactor;
              if (testWidth > maxWidth) {
                pdf.text(currentLine, margin + 5, y);
                y += lineHeight;
                currentLine = word + ' ';
              } else {
                currentLine = testLine;
              }
            });
            if (currentLine.trim()) {
              pdf.text(currentLine, margin + 5, y);
            }
          } else {
            pdf.text(line, margin + 5, y);
          }
          y += lineHeight;
        }
        // Handle code blocks
        else if (line.startsWith('```') || line === '```') {
          y += lineHeight; // Skip backticks line
        }
        // Handle plain text
        else if (line.trim()) {
          const textWidth = pdf.getStringUnitWidth(line) * pdf.getFontSize() / pdf.internal.scaleFactor;
          if (textWidth > maxWidth) {
            // Split long lines
            const splitText = pdf.splitTextToSize(line, maxWidth);
            splitText.forEach((text: string) => {
              if (y > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                y = margin;
              }
              pdf.text(text, margin, y);
              y += lineHeight;
            });
          } else {
            if (y > pdf.internal.pageSize.getHeight() - margin) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin, y);
            y += lineHeight;
          }
        } else {
          // Add spacing for empty lines
          y += lineHeight/2;
        }
        
        // Check if we need a new page
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
      });
      
      // Save the PDF
      pdf.save('markdown-export.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF. Please try again.');
    }
  };

  // Show loading state until hydrated
  if (!isHydrated) {
    return (
      <div className={`flex-1 min-h-[400px] md:h-[calc(100vh-10rem)] flex flex-col ${className}`}>
        <div className="flex justify-end space-x-2 mb-2">
          <button
            disabled
            className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed"
          >
            Copy
          </button>
          <button
            disabled
            className="px-4 py-2 bg-blue-300 text-white rounded-md cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 border border-gray-300 rounded-md flex items-center justify-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Loading content...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-[400px] md:h-[calc(100vh-10rem)] flex flex-col ${className}`}>
      <div className="flex justify-end space-x-2 mb-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          Copy
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Export PDF
        </button>
      </div>
      <div
        ref={previewRef}
        className="flex-1 overflow-auto p-4 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
      >
        <div className="markdown-preview prose max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm]}
            components={{
              code({className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !className;
                return !isInline && match ? (
                  <SyntaxHighlighter
                    // @ts-expect-error - Type issue with the style object
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {localContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreviewPane; 