import { tv } from "@/lib/utils";

/* -------------------------------------------------------------------------------------------------
 * Variant: ProgressCircle
 * ----------------------------------------------------------------------------------------------- */

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
      "2xl": { label: "text-lg" },
      lg: { label: "text-sm" },
      md: { label: "text-xs" },
      sm: { label: "text-[10px]" },
      xl: { label: "text-base" },
    },
    thickness: { regular: {}, thick: {}, thin: {} },
    variant: {
      default: { indicator: "text-primary", track: "text-primary/20" },
      destructive: { indicator: "text-destructive", track: "text-destructive/20" },
    },
  },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { progressCircleVariants };
