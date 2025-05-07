import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

import type { VariantProps } from "@/lib/utils";

import { badgeVariants } from "@/components/badge/badge-variants";

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
