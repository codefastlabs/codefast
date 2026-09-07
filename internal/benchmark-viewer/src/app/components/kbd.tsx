import type { ComponentProps } from "react";

import { cn } from "#/app/lib/utils";

/**
 * Renders a keyboard key inline with the surrounding text.
 *
 * @remarks Sized below the text it sits in, with a floor for small captions: a monospace face at the
 * same nominal size reads larger than the proportional face beside it, and the border and padding add to that.
 *
 * @since 0.8.0
 */
export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      {...props}
      className={cn(
        "rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-[max(0.8125em,0.6875rem)] leading-none text-zinc-300",
        className,
      )}
    />
  );
}
