import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import type { CopyAnalyticsKind } from "#/components/shared/copy-button";
import { CopyButton } from "#/components/shared/copy-button";

interface CopySnippetProps extends ComponentProps<"div"> {
  readonly code: string;
  readonly label?: string;
  /** When set together with `analyticsName`, tracks `copy_code` on a successful copy. */
  readonly analyticsKind?: CopyAnalyticsKind | undefined;
  /** Identifier for what was copied — never the copied text. */
  readonly analyticsName?: string | undefined;
}

/** Plain-text code block with a copy button — used on Getting Started steps. */
export function CopySnippet({
  code,
  label = "Copy code",
  analyticsKind,
  analyticsName,
  className,
  ...props
}: CopySnippetProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border border-ui-border/60 bg-neutral-900", className)}
      {...props}
    >
      <pre className="overflow-x-auto p-5 pe-24 text-sm leading-relaxed text-neutral-100">
        <code>{code}</code>
      </pre>
      <CopyButton
        value={code}
        tone="dark"
        aria-label={label}
        analyticsKind={analyticsKind}
        analyticsName={analyticsName}
        className="absolute inset-e-3 top-3"
      />
    </div>
  );
}
