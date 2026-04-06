"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

type InputProps = ComponentProps<"input">;

function Input({ className, type, ...props }: InputProps): JSX.Element {
  return (
    <input
      className={cn(
        "h-9 w-full min-w-0",
        "rounded-lg border border-field-border bg-field shadow-xs",
        "px-3 py-1",
        "text-base md:text-sm",
        "transition-[color,box-shadow] outline-none",
        "selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground",
        "hover:not-disabled:bg-field-hover hover:not-disabled:not-focus-visible:border-field-border-hover",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring-focus",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-ring-destructive",
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

export { Input };
export type { InputProps };
