import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CodeBlockProps {
  /** Raw source, written to the clipboard on copy. */
  code: string;
  /** Pre-highlighted Shiki HTML, injected verbatim. */
  highlightedCode: string;
  /** Extra classes for the scroll container (e.g. a min-height). */
  className?: string | undefined;
}

/**
 * Shiki-highlighted code surface with a copy button. Shared by the component
 * gallery cards and the per-component detail pages.
 */
export function CodeBlock({ code, highlightedCode, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard access denied — no visual change
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "overflow-x-auto [&_.shiki]:overflow-x-auto [&_.shiki]:bg-neutral-900! [&_.shiki]:p-5 [&_.shiki]:text-xs [&_.shiki]:leading-relaxed [&_.shiki]:tab-2!",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label="Copy code"
        className="absolute end-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
      >
        {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
