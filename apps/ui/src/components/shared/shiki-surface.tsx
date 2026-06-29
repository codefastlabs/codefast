import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface ShikiSurfaceProps extends ComponentProps<"div"> {
  readonly html: string;
  /** Render a gutter numbering each `.line` via a pure-CSS counter. */
  readonly showLineNumbers?: boolean | undefined;
}

/** A Shiki-highlighted HTML surface; the dual-theme HTML themes itself via CSS (see `styles.css`). */
export function ShikiSurface({ html, className, showLineNumbers, ...props }: ShikiSurfaceProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto [&_.shiki]:overflow-x-auto [&_.shiki]:p-5 [&_.shiki]:text-xs [&_.shiki]:leading-relaxed [&_.shiki]:tab-2!",
        // Sticky line-number gutter; its bg must match the Shiki theme bg
        // (#fff / #24292e) so scrolled code can't bleed through underneath.
        showLineNumbers &&
          "[&_.line]:before:sticky [&_.line]:before:left-0 [&_.line]:before:inline-block [&_.line]:before:w-16 [&_.line]:before:bg-white [&_.line]:before:ps-5 [&_.line]:before:pe-4 [&_.line]:before:text-right [&_.line]:before:text-ui-muted [&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line] dark:[&_.line]:before:bg-[#24292e] [&_.shiki]:ps-0 [&_code]:[counter-reset:line]",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}
