import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: ProgressCircle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const progressCircleVariants = tv({
  defaultVariants: { size: "md", thickness: "regular", variant: "default" },
  slots: {
    indicator: "origin-center",
    label: "absolute inset-0 flex items-center justify-center text-xs font-medium",
    root: "relative inline-flex items-center justify-center",
    svg: "size-full",
    track: "origin-center",
  },
  variants: {
    size: {
      sm: { label: "text-[0.625rem]" },
      md: { label: "text-xs" },
      lg: { label: "text-sm" },
      xl: { label: "text-base" },
      "2xl": { label: "text-lg" },
    },
    thickness: { regular: {}, thick: {}, thin: {} },
    variant: {
      default: { indicator: "text-primary", track: "text-primary/20" },
      destructive: { indicator: "text-destructive", track: "text-destructive/20" },
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type ProgressCircleVariants = VariantProps<typeof progressCircleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { progressCircleVariants };
export type { ProgressCircleVariants };
