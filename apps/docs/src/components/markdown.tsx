import parse, { Element, domToReact } from 'html-react-parser';
import { Link } from '@tanstack/react-router';
import type { DOMNode, HTMLReactParserOptions } from 'html-react-parser';
import type { JSX } from 'react';

interface MarkdownProps {
  html: string;
  className?: string;
}

/**
 * Renders pre-processed HTML from markdown content.
 * Expects HTML to be pre-rendered at build-time via content-collections.
 */
export function Markdown({ html, className }: MarkdownProps): JSX.Element {
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (!(domNode instanceof Element)) {
        return;
      }

      // Handle internal links with router's Link component
      if (domNode.name === 'a') {
        const { href } = domNode.attribs;

        if (href?.startsWith('/')) {
          return <Link to={href}>{domToReact(domNode.children as DOMNode[], options)}</Link>;
        }
      }

      // Handle images with lazy loading
      if (domNode.name === 'img') {
        const { src, alt } = domNode.attribs;

        if (src) {
          return <img alt={alt ?? ''} className="rounded-lg shadow-md" loading="lazy" src={src} />;
        }
      }

      return;
    },
  };

  return <div className={className}>{parse(html, options)}</div>;
}
