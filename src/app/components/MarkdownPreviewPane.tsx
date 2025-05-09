"use client";

import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useMarkdownStore } from "../store/markdownStore";
import { createRoot } from "react-dom/client";
import "../markdownStyles.css";

interface MarkdownPreviewPaneProps {
  className?: string;
}

const MarkdownPreviewPane = ({ className = "" }: MarkdownPreviewPaneProps) => {
  const { content } = useMarkdownStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [localContent, setLocalContent] = useState("");
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
      const tempElement = document.createElement("div");
      tempElement.innerHTML = htmlContent;

      // Use the Clipboard API to copy HTML content
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([tempElement.innerHTML], { type: "text/html" }),
          "text/plain": new Blob([previewRef.current.innerText], {
            type: "text/plain",
          }),
        }),
      ]);

      alert("Content copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy: ", error);
      alert("Failed to copy content.");
    }
  };

  const handleExport = async () => {
    if (!previewRef.current) return;

    try {
      // Create a temporary container for PDF export with light theme
      const tempContainer = document.createElement("div");
      tempContainer.className = "pdf-export-container";
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = `${previewRef.current.offsetWidth}px`;
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.color = "black";
      tempContainer.style.padding = "20px";

      // Clone the content into the light-themed container
      const markdownContentDiv = document.createElement("div");
      markdownContentDiv.className =
        "markdown-preview-for-export markdown-preview prose max-w-none";

      // Add custom styles for PDF export
      const style = document.createElement("style");
      style.textContent = `
        .markdown-preview-for-export {
          color: black !important;
        }
        .markdown-preview-for-export h1, 
        .markdown-preview-for-export h2, 
        .markdown-preview-for-export h3, 
        .markdown-preview-for-export h4 {
          color: black !important;
          font-weight: bold !important;
        }
        .markdown-preview-for-export p, 
        .markdown-preview-for-export li,
        .markdown-preview-for-export span,
        .markdown-preview-for-export div {
          color: black !important;
        }
        .markdown-preview-for-export code {
          background-color: #f5f5f5 !important;
          color: #e83e8c !important;
        }
        .markdown-preview-for-export pre {
          background-color: #f5f5f5 !important;
          border: 1px solid #ddd !important;
        }
        .markdown-preview-for-export pre code {
          color: #333 !important;
        }
        .markdown-preview-for-export a {
          color: #2563eb !important;
        }
        .markdown-preview-for-export blockquote {
          color: #4b5563 !important;
          border-left-color: #d1d5db !important;
        }
      `;

      tempContainer.appendChild(style);
      tempContainer.appendChild(markdownContentDiv);
      document.body.appendChild(tempContainer);

      // Render the markdown in the temporary container
      const ReactMarkdownComponent = (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !className;
              return !isInline && match ? (
                <SyntaxHighlighter
                  // @ts-expect-error - Type issue with the style object
                  style={atomDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {localContent}
        </ReactMarkdown>
      );

      // Use React 18's createRoot API
      const root = createRoot(markdownContentDiv);
      root.render(ReactMarkdownComponent);

      // Wait for rendering to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate PNG from the temporary element
      const dataUrl = await toPng(tempContainer);

      // Create a new PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate width to fit on PDF while maintaining aspect ratio
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add the image to the PDF
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Save the PDF
      pdf.save("markdown-export.pdf");

      // Clean up
      root.unmount();
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Error exporting to PDF: ", error);
      alert("Failed to export to PDF.");
    }
  };

  // Show loading state until hydrated
  if (!isHydrated) {
    return (
      <div
        className={`flex-1 min-h-[400px] md:h-[calc(100vh-10rem)] flex flex-col ${className}`}
      >
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
    <div
      className={`flex-1 min-h-[400px] md:h-[calc(100vh-10rem)] flex flex-col ${className}`}
    >
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
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !className;
                return !isInline && match ? (
                  <SyntaxHighlighter
                    // @ts-expect-error - Type issue with the style object
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
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
