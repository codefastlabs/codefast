import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: ButtonGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const buttonGroupVariants = tv({
  base: "group/button-group flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-e-lg [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  defaultVariants: {
    orientation: "horizontal",
  },
  variants: {
    orientation: {
      horizontal:
        "[&>*:not(:first-child)]:rounded-s-none [&>*:not(:first-child)]:border-s-0 [&>*:not(:last-child)]:rounded-e-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-e-lg!",
      vertical:
        "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg!",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { buttonGroupVariants };
export type { ButtonGroupVariants };
