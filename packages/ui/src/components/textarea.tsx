import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

type TextareaProps = ComponentProps<"textarea">;

function Textarea({ className, ...props }: TextareaProps): JSX.Element {
  return (
    <textarea
      className={cn(
        "flex min-h-16 w-full grow",
        "rounded-lg border border-field-border bg-field shadow-xs",
        "px-3 py-2",
        "text-base md:text-sm",
        "outline-hidden transition",
        "placeholder:text-muted-foreground",
        "hover:not-disabled:not-focus-visible:border-field-border-hover",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring-focus",
        "disabled:opacity-50",
        "aria-invalid:border-destructive focus-within:aria-invalid:ring-ring-destructive hover:not-disabled:not-focus-within:aria-invalid:border-destructive/60",
        className,
      )}
      data-slot="textarea"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Textarea };
export type { TextareaProps };
