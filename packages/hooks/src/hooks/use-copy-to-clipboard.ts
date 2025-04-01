'use client';

import { useState } from 'react';

export function useCopyToClipboard({
  timeout = 2000,
  onCopy,
}: {
  onCopy?: () => void;
  timeout?: number;
} = {}): { copyToClipboard: (value: string) => Promise<void>; isCopied: boolean } {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (value: string): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
    if (typeof window === 'undefined' || !navigator.clipboard.writeText) {
      return;
    }

    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);

      if (onCopy) {
        onCopy();
      }

      setTimeout(() => {
        setIsCopied(false);
      }, timeout);
    } catch (error) {
      // eslint-disable-next-line no-console -- ignore
      console.error(error);
    }
  };

  return { isCopied, copyToClipboard };
}
