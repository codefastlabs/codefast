import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Alert
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const alertVariants = tv({
  base: "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-xl border bg-card px-4 py-3 text-sm has-[>svg]:grid-cols-[--spacing(4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "text-card-foreground",
      destructive:
        "text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type AlertVariants = VariantProps<typeof alertVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { alertVariants };
export type { AlertVariants };
