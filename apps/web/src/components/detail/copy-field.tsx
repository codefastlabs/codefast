import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { CopyButton } from "#/components/shared/copy-button";

interface CopyFieldProps extends ComponentProps<"div"> {
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string;
  readonly copyLabel: string;
}

/** A labelled read-only value with an inline copy button. */
export function CopyField({ label, value, valueClassName, copyLabel, className, ...props }: CopyFieldProps) {
  return (
    <div className={className} {...props}>
      <p className="mb-1.5 text-xs font-semibold tracking-widest text-ui-muted uppercase">{label}</p>
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-ui-border/60 bg-ui-surface px-4 py-2.5">
        <code className={cn("min-w-0 truncate font-mono text-sm", valueClassName)}>{value}</code>
        <CopyButton value={value} aria-label={copyLabel} className="shrink-0" />
      </div>
    </div>
  );
}
