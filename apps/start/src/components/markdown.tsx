import { useEffect, useState } from 'react';
import parse, { Element, domToReact } from 'html-react-parser';
import { Link } from '@tanstack/react-router';
import type { DOMNode, HTMLReactParserOptions } from 'html-react-parser';
import type { ReactNode } from 'react';
import type { MarkdownResult } from '@/utils/markdown';
import { renderMarkdown } from '@/utils/markdown';
import { CodeBlock } from '@/components/code-block';

interface TextNode {
  type: 'text';
  data?: string;
}

interface ParentNode {
  type: string;
  children?: DOMNode[];
}

type ExtractableNode = TextNode | ParentNode;

/**
 * Determines if a node is a text node.
 */
function isTextNode(node: ExtractableNode): node is TextNode {
  return node.type === 'text';
}

/**
 * Determines if a node has children.
 */
function isParentNode(node: ExtractableNode): node is ParentNode {
  return 'children' in node && Array.isArray(node.children);
}

/**
 * Recursively extracts text content from a DOM node.
 */
function extractText(node: ExtractableNode): string {
  if (isTextNode(node)) {
    return node.data ?? '';
  }

  if (isParentNode(node) && node.children) {
    return node.children.map((child) => extractText(child as ExtractableNode)).join('');
  }

  return '';
}

/**
 * Gets text content from a DOM element.
 */
function getText(element: Element): string {
  return extractText(element as ExtractableNode);
}

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps): ReactNode {
  const [result, setResult] = useState<MarkdownResult | null>(null);

  useEffect(() => {
    void renderMarkdown(content).then(setResult);
  }, [content]);

  if (!result) {
    return <div className={className}>Loading...</div>;
  }

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (!(domNode instanceof Element)) {
        return;
      }

      // Handle code blocks with syntax highlighting
      if (domNode.name === 'pre') {
        const codeElement = domNode.children.find(
          (child): child is Element => child instanceof Element && child.name === 'code',
        );

        if (codeElement) {
          const codeClassName = codeElement.attribs.class ?? '';
          const language = codeClassName.replace('language-', '') || 'text';
          const code = getText(codeElement);

          return <CodeBlock code={code} language={language} />;
        }
      }

      // Handle links
      if (domNode.name === 'a') {
        const { href } = domNode.attribs;

        if (href?.startsWith('/')) {
          // Internal link - use router's Link component
          return (
            <Link to={href}>
              {domToReact(domNode.children as unknown as Parameters<typeof domToReact>[0], options)}
            </Link>
          );
        }
      }

      // Handle images - use native img since we don't have width/height data
      if (domNode.name === 'img') {
        const { src, alt } = domNode.attribs;

        if (src) {
          return <img alt={alt ?? ''} className="rounded-lg shadow-md" loading="lazy" src={src} />;
        }
      }

      return;
    },
  };

  return <div className={className}>{parse(result.markup, options)}</div>;
}
