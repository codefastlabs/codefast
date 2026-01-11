'use client';

import { useEffect, useState } from 'react';
import { highlightCode } from '@/utils/markdown';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    highlightCode(code, language).then(setHighlightedHtml);
  }, [code, language]);

  if (!highlightedHtml) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}
