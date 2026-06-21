import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface ShikiSurfaceProps extends ComponentProps<"div"> {
  readonly html: string;
}

/** A Shiki-highlighted HTML surface; `className` toggles light/dark visibility. */
export function ShikiSurface({ html, className, ...props }: ShikiSurfaceProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto [&_.shiki]:overflow-x-auto [&_.shiki]:p-5 [&_.shiki]:text-xs [&_.shiki]:leading-relaxed [&_.shiki]:tab-2!",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}
