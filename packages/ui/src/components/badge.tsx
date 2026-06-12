import { Slot } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import type { BadgeVariants } from "#/variants/badge";
import { badgeVariants } from "#/variants/badge";

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface BadgeProps extends ComponentProps<"span">, BadgeVariants {
  asChild?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function Badge({ asChild = false, className, variant = "default", ...props }: BadgeProps): JSX.Element {
  const Component = asChild ? Slot.Root : "span";

  return (
    <Component className={badgeVariants({ className, variant })} data-slot="badge" data-variant={variant} {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge };

export type { BadgeProps };
