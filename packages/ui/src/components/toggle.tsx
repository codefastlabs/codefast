"use client";

import { tv } from "#utils/tv";
import type { VariantProps } from "#utils/tv";
import type { ComponentProps, JSX } from "react";

import * as TogglePrimitive from "@radix-ui/react-toggle";

/* -----------------------------------------------------------------------------
 * Variant: Toggle
 * -------------------------------------------------------------------------- */

const toggleVariants = tv({
  base: "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-secondary-hover hover:text-secondary-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-ring-destructive data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variants: {
    size: {
      default: "h-9 min-w-9 px-2",
      lg: "h-10 min-w-10 px-2.5",
      sm: "h-8 min-w-8 px-1.5",
    },
    variant: {
      default: "bg-transparent",
      outline:
        "border border-field-border bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

type ToggleVariants = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

interface ToggleProps extends ComponentProps<typeof TogglePrimitive.Root>, ToggleVariants {}

function Toggle({ children, className, size, variant, ...props }: ToggleProps): JSX.Element {
  return (
    <TogglePrimitive.Root
      className={toggleVariants({ className, size, variant })}
      data-slot="toggle"
      {...props}
    >
      {children}
    </TogglePrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle, toggleVariants };
export type { ToggleProps, ToggleVariants };
