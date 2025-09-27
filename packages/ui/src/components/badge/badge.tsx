"use client";

import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { badgeVariants } from "@/components/badge/badge.variants";
import { Slot } from "@radix-ui/react-slot";

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

export { Badge };

export type { BadgeProps };
