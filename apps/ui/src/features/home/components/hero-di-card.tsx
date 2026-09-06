import { cn } from "@codefast/ui/lib/utils";
import { BracesIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { CodeBlock } from "#/components/shared/code-block";

interface HeroDiCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The sample as dual-theme highlighted HTML. */
  readonly highlightedCode: string;
}

/** The hero's code card: the flagship's quick start, wired and resolved in a dozen lines. */
export function HeroDiCard({ highlightedCode, className, ...props }: HeroDiCardProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-ui-border/60 bg-ui-card shadow-2xl shadow-black/10 dark:shadow-black/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-ui-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">
          <BracesIcon className="size-3.5" />
          Quick start
        </div>
        <span className="font-mono text-xs text-ui-muted">@codefast/di</span>
      </div>
      <CodeBlock highlightedCode={highlightedCode} />
    </div>
  );
}
