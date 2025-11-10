"use client";

import type { ComponentProps, JSX } from "react";

import { cn, tv } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    input:
      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    root: "border-input not-has-disabled:shadow-xs hover:not-has-disabled:not-focus-within:border-ring/60 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3 has-disabled:opacity-50 [&>svg]:text-muted-foreground has-aria-invalid:border-destructive hover:not-has-disabled:not-focus-within:has-aria-invalid:border-destructive/60 focus-within:has-aria-invalid:ring-destructive/20 dark:focus-within:has-aria-invalid:ring-destructive/40 dark:bg-input/30 peer flex h-9 w-full grow items-center gap-3 rounded-lg border px-3 text-base transition md:text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  },
});

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

type InputProps = ComponentProps<"input">;

function Input({ className, type, ...props }: InputProps): JSX.Element {
  return (
    <input
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-lg border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { inputVariants };
export { Input };
export type { InputProps };
