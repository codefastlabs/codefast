import * as SeparatorPrimitive from "radix-ui/separator";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import type { SeparatorVariants } from "#/variants/separator";
import { separatorVariants } from "#/variants/separator";

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SeparatorProps
  extends ComponentProps<typeof SeparatorPrimitive.Root>, Omit<SeparatorVariants, "orientation"> {}

/**
 * @since 0.3.16-canary.0
 */
function Separator({ align, className, decorative = true, orientation, ...props }: SeparatorProps): JSX.Element {
  return (
    <SeparatorPrimitive.Root
      className={separatorVariants({ align, className, orientation })}
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SeparatorItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SeparatorItemProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SeparatorItem({ className, ...props }: SeparatorItemProps): JSX.Element {
  return (
    <div
      className={cn("absolute mx-2 bg-background px-2 text-sm text-muted-foreground", className)}
      data-slot="separator-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Separator, SeparatorItem };
export type { SeparatorItemProps, SeparatorProps };
