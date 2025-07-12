"use client";

import { Slot } from "@radix-ui/react-slot";

import { badgeVariants } from "@/components/badge/badge-variants";

import type { VariantProps } from "@/lib/utils";
import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, asChild, variant, ...props }: BadgeProps): JSX.Element {
  const Component = asChild ? Slot : "span";

  return <Component className={badgeVariants({ className, variant })} data-slot="badge" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge };

export type { BadgeProps };
