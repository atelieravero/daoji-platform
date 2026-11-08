// components/shared/MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface MarkdownRendererProps {
  content?: string;
  className?: string;
  /**
   * The semantic & visual heading level that Markdown `#` (level 1) should render as.
   * - 2 (default): Page / Post / Event main body (where the page title itself is h1)
   * - 3: Form header subtitles and success messages
   * - 4: Form informational (`info`) blocks
   * - 5: Form question descriptions / hints
   */
  baseHeadingLevel?: HeadingLevel;
}

const HEADING_STYLES: Record<HeadingLevel, string> = {
  1: 'text-2xl md:text-3xl font-extrabold text-ink-primary tracking-tight mt-8 mb-4 first:mt-0 leading-tight',
  2: 'text-[20px] md:text-[22px] font-bold text-ink-primary tracking-tight mt-8 mb-3.5 first:mt-0 leading-snug border-l-[3px] border-primary pl-3',
  3: 'text-[17px] md:text-[18px] font-bold text-primary-active mt-6 mb-2.5 first:mt-0 leading-snug',
  4: 'text-base font-bold text-ink-primary mt-4 mb-2 first:mt-0 leading-snug',
  5: 'text-sm font-bold text-ink-body mt-3 mb-1 first:mt-0 leading-snug',
  6: 'text-xs font-bold text-ink-muted uppercase tracking-wider mt-2.5 mb-1 first:mt-0 leading-snug',
};

export default function MarkdownRenderer({
  content,
  className = '',
  baseHeadingLevel = 2,
}: MarkdownRendererProps) {
  if (!content) return null;

  // 1. Temporarily protect fenced code blocks, markdown links/images, and raw URLs
  const placeholders: string[] = [];

  let protectedContent = content
    // Protect fenced code blocks
    .replace(/(```[\s\S]*?```)/g, (match) => {
      placeholders.push(match);
      return `@@MD_PROTECTED_TOKEN_${placeholders.length - 1}@@`;
    })
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
  // Also normalize line-start `#標題` without a space into `# 標題` for CJK convenience
  protectedContent = protectedContent
    .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
    .replace(/!!(.*?)!!/g, '<span class="text-status-danger font-medium">$1</span>')
    .replace(
      /(?<!\w)__(.*?)__(?!\w)/g,
      '<u class="underline decoration-stone-400 underline-offset-4 text-ink-primary">$1</u>'
    );

  // 3. Restore all original code blocks, links, images, and URLs
  const finalContent = protectedContent.replace(
    /@@MD_PROTECTED_TOKEN_(\d+)@@/g,
    (_, index) => placeholders[Number(index)]
  );

  // Helper to shift markdown heading level (1..6) relative to baseHeadingLevel
  const createHeadingRenderer = (markdownLevel: HeadingLevel) => {
    const effectiveLevel = Math.min(
      6,
      Math.max(1, baseHeadingLevel + markdownLevel - 1)
    ) as HeadingLevel;
    const Tag = `h${effectiveLevel}` as keyof React.JSX.IntrinsicElements;
    const headingClass = HEADING_STYLES[effectiveLevel];

    return function RelativeHeading({
      node,
      className: customClass,
      children,
      ...props
    }: any) {
      return (
        <Tag className={`${headingClass} ${customClass || ''}`.trim()} {...props}>
          {children}
        </Tag>
      );
    };
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: createHeadingRenderer(1),
          h2: createHeadingRenderer(2),
          h3: createHeadingRenderer(3),
          h4: createHeadingRenderer(4),
          h5: createHeadingRenderer(5),
          h6: createHeadingRenderer(6),
          p: ({ node, ...props }) => (
            <p className="mb-4 last:mb-0 leading-[1.8]" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="font-semibold text-link underline decoration-dotted decoration-link-underline decoration-[2.5px] underline-offset-[5px] hover:text-link-hover hover:bg-link-highlight hover:decoration-solid hover:decoration-link-hover px-0.5 -mx-0.5 rounded-sm transition-all"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 mb-4 space-y-1.5 leading-[1.8]" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 mb-4 space-y-1.5 leading-[1.8]" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-accent-ochre pl-4 py-2.5 my-4 italic text-ink-body bg-surface-cream/70 rounded-r-xl"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t border-surface-dark" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img
              className="rounded-2xl max-w-full h-auto my-5 border border-surface-dark"
              loading="lazy"
              {...props}
            />
          ),
          code: ({ node, className: codeClass, children, ...props }) => {
            const isBlock = Boolean(codeClass && codeClass.includes('language-'));
            if (isBlock) {
              return (
                <code
                  className={`block p-4 my-4 rounded-xl bg-ink-primary text-surface-base font-mono text-xs overflow-x-auto ${codeClass || ''}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-surface-cream text-primary-active font-mono text-[0.9em]"
                {...props}
              >
                {children}
              </code>
            );
          },
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-ink-primary" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-5 rounded-xl border border-surface-dark">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-surface-cream text-ink-primary" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr
              className="border-b border-surface-dark last:border-0 even:bg-surface-base/60"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-2.5 text-left font-bold text-ink-primary border-r border-surface-dark last:border-r-0"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-4 py-2.5 text-ink-body border-r border-surface-dark last:border-r-0"
              {...props}
            />
          ),
        }}
      >
        {finalContent}
      </ReactMarkdown>
    </div>
  );
}