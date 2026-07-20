import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Field
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const fieldVariants = tv({
  base: "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  defaultVariants: {
    orientation: "vertical",
  },
  variants: {
    orientation: {
      horizontal:
        "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type FieldVariants = VariantProps<typeof fieldVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { fieldVariants };
export type { FieldVariants };
