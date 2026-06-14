import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Toggle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const toggleVariants = tv({
  base: "group/toggle inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
      sm: "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5",
      lg: "h-10 min-w-10 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
    },
    variant: {
      default: "bg-transparent",
      outline: "border border-input bg-transparent shadow-xs hover:bg-muted",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type ToggleVariants = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toggleVariants };
export type { ToggleVariants };
