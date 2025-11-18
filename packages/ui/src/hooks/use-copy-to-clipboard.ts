'use client';

import { useState } from 'react';

/**
 * Provide clipboard copy capability with a transient copied state.
 *
 * Internally uses the Clipboard API when available and sets a temporary
 * `isCopied` flag for UI feedback. A custom callback may be invoked upon copy.
 *
 * @param options - Configuration options.
 *   - onCopy: Callback invoked after a successful copy.
 *   - timeout: Duration in milliseconds to keep `isCopied` true. Defaults to 2000.
 * @returns An object with a `copyToClipboard` function and an `isCopied` flag.
 *
 * @example
 * ```tsx
 * const { copyToClipboard, isCopied } = useCopyToClipboard({ timeout: 1500 });
 * <button onClick={() => copyToClipboard("Hello")}>{isCopied ? "Copied" : "Copy"}</button>
 * ```
 */
export function useCopyToClipboard({ onCopy, timeout = 2000 }: { onCopy?: () => void; timeout?: number } = {}): {
  copyToClipboard: (value: string) => Promise<void>;
  isCopied: boolean;
} {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (value: string): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof globalThis === 'undefined' || !navigator.clipboard.writeText) {
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
      console.error(error);
    }
  };

  return { copyToClipboard, isCopied };
}
