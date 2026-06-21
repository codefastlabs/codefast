import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { CopyButton } from "#/components/shared/copy-button";

interface CopySnippetProps extends ComponentProps<"div"> {
  readonly code: string;
  readonly label?: string;
}

/** Plain-text code block with a copy button — used on Getting Started steps. */
export function CopySnippet({ code, label = "Copy code", className, ...props }: CopySnippetProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border border-ui-border/60 bg-neutral-900", className)}
      {...props}
    >
      <pre className="overflow-x-auto p-5 pe-24 text-sm leading-relaxed text-neutral-100">
        <code>{code}</code>
      </pre>
      <CopyButton value={code} tone="dark" aria-label={label} className="absolute inset-e-3 top-3" />
    </div>
  );
}
