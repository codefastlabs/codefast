import * as LabelPrimitive from "radix-ui/label";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Label
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Label({ className, ...props }: LabelProps): JSX.Element {
  return (
    <LabelPrimitive.Root
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-disabled:pointer-events-none group-data-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-aria-invalid:text-destructive peer-data-disabled:opacity-50 data-invalid:text-destructive",
        className,
      )}
      data-slot="label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Label };
export type { LabelProps };
