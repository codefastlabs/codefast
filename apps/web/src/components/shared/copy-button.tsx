import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";

interface CopyButtonProps {
  /** Raw text written to the clipboard. */
  readonly value: string;
  /** Positioning/extra classes — callers pin it (e.g. `absolute inset-e-3 top-3`). */
  readonly className?: string;
}

/**
 * Floating Copy button for code surfaces. Stateless beyond the transient
 * "Copied!" feedback from `useCopyToClipboard`; the container owns positioning
 * so an `absolute` button can sit over a non-scrolling wrapper and stay put.
 */
export function CopyButton({ value, className }: CopyButtonProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => void copyToClipboard(value)}
      aria-label="Copy code"
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200",
        "border-ui-border/60 bg-ui-card/90 text-ui-muted shadow-sm backdrop-blur-sm hover:bg-ui-surface hover:text-ui-fg",
        "dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:shadow-none dark:hover:bg-white/20 dark:hover:text-white",
        className,
      )}
    >
      {isCopied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
      {isCopied ? "Copied!" : "Copy"}
    </button>
  );
}
