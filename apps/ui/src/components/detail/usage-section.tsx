import { CodeIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DocSection } from "#/components/detail/doc-section";
import { CodeBlock } from "#/components/shared/code-block";
import { CopyButton } from "#/components/shared/copy-button";

interface UsageSectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  /** Raw source for the Copy button and the line count in the toolbar. */
  readonly code: string;
  /** Pre-highlighted dual-theme Shiki HTML for `code`. */
  readonly highlightedCode: string;
  /** Component slug — tracked as `copy_code`'s `name` when the usage snippet is copied. */
  readonly analyticsName: string;
}

/** The "Usage" section: the minimal import + composition, ahead of the styled Examples. */
export function UsageSection({ code, highlightedCode, analyticsName, ...props }: UsageSectionProps) {
  const lineCount = code.trimEnd().split("\n").length;

  return (
    <DocSection
      id="usage"
      title="Usage"
      description="The minimal import and composition — see Examples below for styled, real-world variants."
      {...props}
    >
      <div className="overflow-hidden rounded-2xl border border-ui-border/60 bg-ui-surface">
        <div className="flex items-center gap-2 border-b border-ui-border/60 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ui-muted">
            <CodeIcon className="size-3.5" aria-hidden />
            {`${String(lineCount)} lines`}
          </span>
          <div className="ms-auto flex items-center gap-1">
            <CopyButton value={code} tone="overlay" analyticsKind="usage-example" analyticsName={analyticsName} />
          </div>
        </div>
        <CodeBlock highlightedCode={highlightedCode} showLineNumbers />
      </div>
    </DocSection>
  );
}
