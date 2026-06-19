import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CodeBlockProps {
  /** Raw source, written to the clipboard on copy. */
  code: string;
  /** Pre-highlighted Shiki HTML for dark mode. */
  highlightedCodeDark: string;
  /** Pre-highlighted Shiki HTML for light mode. Falls back to dark-only when omitted. */
  highlightedCodeLight?: string | undefined;
  /** Extra classes for the scroll container (e.g. a min-height). */
  className?: string | undefined;
}

/** A Shiki-highlighted HTML surface; `className` toggles light/dark visibility. */
function ShikiSurface({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-x-auto [&_.shiki]:overflow-x-auto [&_.shiki]:p-5 [&_.shiki]:text-xs [&_.shiki]:leading-relaxed [&_.shiki]:tab-2!",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Shiki-highlighted code surface with a copy button. Renders light and dark
 * highlighted HTML so syntax colors follow the site color scheme.
 */
export function CodeBlock({ code, highlightedCodeDark, highlightedCodeLight, className }: CodeBlockProps) {
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
    <div className={cn("relative", className)}>
      {highlightedCodeLight ? (
        <>
          <ShikiSurface html={highlightedCodeLight} className="dark:hidden" />
          <ShikiSurface html={highlightedCodeDark} className="hidden dark:block" />
        </>
      ) : (
        <ShikiSurface html={highlightedCodeDark} />
      )}
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label="Copy code"
        className={cn(
          "absolute inset-e-3 top-3 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200",
          "border-ui-border/60 bg-ui-card/90 text-ui-muted shadow-sm backdrop-blur-sm hover:bg-ui-surface hover:text-ui-fg",
          "dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:shadow-none dark:hover:bg-white/20 dark:hover:text-white",
        )}
      >
        {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
