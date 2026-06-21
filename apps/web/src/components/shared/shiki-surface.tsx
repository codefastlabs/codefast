import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface ShikiSurfaceProps extends ComponentProps<"div"> {
  readonly html: string;
  /** Render a gutter numbering each `.line` via a pure-CSS counter. */
  readonly showLineNumbers?: boolean | undefined;
}

/** A Shiki-highlighted HTML surface; `className` toggles light/dark visibility. */
export function ShikiSurface({ html, className, showLineNumbers, ...props }: ShikiSurfaceProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto [&_.shiki]:overflow-x-auto [&_.shiki]:p-5 [&_.shiki]:text-xs [&_.shiki]:leading-relaxed [&_.shiki]:tab-2!",
        showLineNumbers &&
          "[&_.line]:before:mr-6 [&_.line]:before:inline-block [&_.line]:before:w-4 [&_.line]:before:text-right [&_.line]:before:text-ui-muted [&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line] [&_code]:[counter-reset:line]",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}
