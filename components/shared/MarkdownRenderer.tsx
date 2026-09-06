import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content?: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // 1. Temporarily protect markdown links/images and raw URLs from custom regex corruption
  const placeholders: string[] = [];

  let protectedContent = content
    // Match ![alt](url) and [text](url)
    .replace(/(!?\[[\s\S]*?\]\([^\)]+\))/g, (match) => {
      placeholders.push(match);
      return `@@MD_PROTECTED_TOKEN_${placeholders.length - 1}@@`;
    })
    // Match standalone http/https URLs
    .replace(/(https?:\/\/[^\s<>"]+)/g, (match) => {
      placeholders.push(match);
      return `@@MD_PROTECTED_TOKEN_${placeholders.length - 1}@@`;
    });

  // 2. Safely apply custom syntax replacements only to prose text
  protectedContent = protectedContent
    .replace(/!!(.*?)!!/g, '<span class="text-red-500 font-medium">$1</span>')
    .replace(/(?<!\w)__(.*?)__(?!\w)/g, '<u class="underline underline-offset-2">$1</u>');

  // 3. Restore all original links, images, and URLs
  const finalContent = protectedContent.replace(
    /@@MD_PROTECTED_TOKEN_(\d+)@@/g,
    (_, index) => placeholders[Number(index)]
  );

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
          a: ({ node, ...props }) => (
            <a
              className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-inherit" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-gray-200 text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b border-gray-200 last:border-0" {...props} />,
          th: ({ node, ...props }) => (
            <th className="px-4 py-2.5 text-left font-semibold text-gray-900 border-r border-gray-200 last:border-r-0" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-gray-700 border-r border-gray-200 last:border-r-0" {...props} />
          ),
        }}
      >
        {finalContent}
      </ReactMarkdown>
    </div>
  );
}