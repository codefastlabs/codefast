"use client";

import { Slot } from "@radix-ui/react-slot";

import { badgeVariants } from "@/components/badge/badge-variants";

import type { VariantProps } from "@/lib/utils";
import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

function Badge({
  className,
  asChild,
  variant,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }): JSX.Element {
  const Component = asChild ? Slot : "span";

  return <Component className={badgeVariants({ className, variant })} data-slot="badge" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge };
