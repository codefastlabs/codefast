import { useEffect, useState } from 'react';
import parse, { Element, domToReact } from 'html-react-parser';
import { Link } from '@tanstack/react-router';
import { toString as hastToString } from 'hast-util-to-string';
import { Image } from '@unpic/react';
import type { HTMLReactParserOptions } from 'html-react-parser';
import type { MarkdownResult } from '@/utils/markdown';
import { renderMarkdown } from '@/utils/markdown';
import { CodeBlock } from '@/components/code-block';

type MarkdownProps = {
  content: string;
  className?: string;
};

/**
 * Gets text content from a DOM element.
 */
function getText(element: Element): string {
  try {
    return hastToString(element as any);
  } catch {
    // Fallback: extract text from children
    const extractText = (node: any): string => {
      if (node.type === 'text') {
        return node.data || '';
      }

      if (node.children) {
        return node.children.map(extractText).join('');
      }

      return '';
    };

    return extractText(element);
  }
}

export function Markdown({ content, className }: MarkdownProps) {
  const [result, setResult] = useState<MarkdownResult | null>(null);

  useEffect(() => {
    renderMarkdown(content).then(setResult);
  }, [content]);

  if (!result) {
    return <div className={className}>Loading...</div>;
  }

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element) {
        // Handle code blocks with syntax highlighting
        if (domNode.name === 'pre') {
          const codeElement = domNode.children.find(
            (child): child is Element => child instanceof Element && child.name === 'code',
          );

          if (codeElement) {
            const codeClassName = codeElement.attribs.class || '';
            const language = codeClassName.replace('language-', '') || 'text';
            const code = getText(codeElement);

            return <CodeBlock code={code} language={language} />;
          }
        }

        // Handle links
        if (domNode.name === 'a') {
          const href = domNode.attribs.href;

          if (href?.startsWith('/')) {
            // Internal link - use router's Link component
            return <Link to={href}>{domToReact(domNode.children as any, options)}</Link>;
          }
        }

        // Handle images
        if (domNode.name === 'img') {
          return <Image loading="lazy" className="rounded-lg shadow-md" {...domNode.attribs} />;
        }
      }
    },
  };

  return <div className={className}>{parse(result.markup, options)}</div>;
}
