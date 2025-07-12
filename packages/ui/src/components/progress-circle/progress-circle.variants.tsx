import { tv } from "@/lib/utils";

/* -------------------------------------------------------------------------------------------------
 * Variant: ProgressCircle
 * -----------------------------------------------------------------------------------------------*/

const progressCircleVariants = tv({
  slots: {
    root: "relative inline-flex items-center justify-center",
    svg: "size-full",
    track: "origin-center",
    indicator: "origin-center",
    label: "absolute inset-0 flex items-center justify-center text-xs font-medium",
  },
  variants: {
    variant: {
      default: { indicator: "text-primary", track: "text-primary/20" },
      destructive: { indicator: "text-destructive", track: "text-destructive/20" },
    },
    size: {
      sm: { label: "text-[10px]" },
      md: { label: "text-xs" },
      lg: { label: "text-sm" },
      xl: { label: "text-base" },
      "2xl": { label: "text-lg" },
    },
    thickness: { thin: {}, regular: {}, thick: {} },
  },
  defaultVariants: { variant: "default", size: "md", thickness: "regular" },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { progressCircleVariants };
