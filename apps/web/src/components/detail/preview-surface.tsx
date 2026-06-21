import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

/**
 * The dotted live-preview surface shared by the LTR and RTL examples: a centered
 * flex stage on a subtle dot grid so the demo reads as distinct from the page.
 * `className` carries the per-example alignment/height tweaks (`previewClassName`).
 */
export function PreviewSurface({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-wrap items-center justify-center gap-3 bg-ui-surface bg-[radial-gradient(var(--color-ui-border)_1px,transparent_1px)] bg-size-[16px_16px] p-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
