import { cn } from "@codefast/ui/lib/utils";
import { BracesIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { CodeBlock } from "#/components/shared/code-block";

interface SnippetCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** What the sample shows, in the card's header. */
  readonly label: string;
  /** The package the sample is written against, opposite the label. */
  readonly caption: string;
  /** The sample as dual-theme highlighted HTML. */
  readonly highlightedCode: string;
}

/** A code sample framed as a card: a header naming the sample and its package, then the highlighted source. */
export function SnippetCard({ label, caption, highlightedCode, className, ...props }: SnippetCardProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-ui-border/60 bg-ui-card shadow-2xl shadow-black/10 dark:shadow-black/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-ui-border/60 px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">
          <BracesIcon className="size-3.5" />
          {label}
        </div>
        <span className="font-mono text-xs text-ui-muted">{caption}</span>
      </div>
      <CodeBlock highlightedCode={highlightedCode} />
    </div>
  );
}
