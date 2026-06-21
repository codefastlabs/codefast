import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps } from "react";

interface CopyFieldProps extends ComponentProps<"div"> {
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string;
  readonly copyLabel: string;
}

/** A labelled read-only value with an inline copy button. */
export function CopyField({ label, value, valueClassName, copyLabel, className, ...props }: CopyFieldProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <div className={className} {...props}>
      <p className="mb-1.5 text-xs font-semibold tracking-widest text-ui-muted uppercase">{label}</p>
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-ui-border/60 bg-ui-surface px-4 py-2.5">
        <code className={cn("min-w-0 truncate font-mono text-sm", valueClassName)}>{value}</code>
        <button
          type="button"
          onClick={() => void copyToClipboard(value)}
          aria-label={isCopied ? "Copied" : copyLabel}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ui-border/60 px-2.5 py-1.5 text-xs font-medium text-ui-muted transition-colors duration-200 hover:bg-ui-card hover:text-ui-fg"
        >
          {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
