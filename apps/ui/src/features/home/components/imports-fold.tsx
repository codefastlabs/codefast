import { cn } from "@codefast/ui/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { CodeBlock } from "#/components/shared/code-block";

interface ImportsFoldProps extends Omit<ComponentProps<"details">, "children"> {
  /** What the fold says while closed, naming where the imports come from. */
  readonly label: string;
  /** The import block as dual-theme highlighted HTML. */
  readonly highlightedCode: string;
}

/** A sample's import block folded behind one line, so the code that matters starts at the top of the frame. */
export function ImportsFold({ label, highlightedCode, className, ...props }: ImportsFoldProps) {
  return (
    <details className={cn("group", className)} {...props}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-2 font-mono text-xs text-ui-muted transition-colors select-none hover:text-ui-fg">
        <ChevronRightIcon className="size-3.5 transition-transform group-open:rotate-90" />
        {label}
      </summary>
      <CodeBlock highlightedCode={highlightedCode} />
    </details>
  );
}
