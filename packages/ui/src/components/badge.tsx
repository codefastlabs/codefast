"use client";

import type { VariantProps } from "@codefast/tailwind-variants";
import { tv } from "@codefast/tailwind-variants";
import type { ComponentProps, JSX } from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: "inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap outline-hidden transition focus-visible:ring-3 focus-visible:ring-ring-focus [&>svg]:size-3 [&>svg]:shrink-0",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default:
        "border-transparent bg-primary text-primary-foreground focus-visible:ring-ring-focus [a&]:hover:bg-primary-hover",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground focus-visible:ring-ring-destructive [a&]:hover:bg-destructive-hover",
      outline:
        "border-field-border bg-background text-foreground focus-visible:border-ring [a&]:hover:border-field-border-hover [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      secondary:
        "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary-hover",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ asChild, className, variant, ...props }: BadgeProps): JSX.Element {
  const Component = asChild ? Slot : "span";

  return (
    <Component className={badgeVariants({ className, variant })} data-slot="badge" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { badgeVariants };
export { Badge };

export type { BadgeProps };
