"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

type InputProps = ComponentProps<"input">;

function Input({ className, type, ...props }: InputProps): JSX.Element {
  return (
    <input
      className={cn(
        "h-9 w-full min-w-0",
        "px-3 py-1",
        "rounded-lg border border-input bg-transparent shadow-xs",
        "text-base",
        "transition-[color,box-shadow] outline-none",
        "selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        "dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "dark:aria-invalid:ring-destructive/40",
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
