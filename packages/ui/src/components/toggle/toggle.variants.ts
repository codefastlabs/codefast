import { tv } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Toggle
 * -------------------------------------------------------------------------- */

const toggleVariants = tv({
  base: "focus-visible:ring-ring/50 focus-visible:ring-3 outline-hidden hover:not-disabled:not-data-[state=on]:bg-secondary data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  defaultVariants: {
    size: "md",
    variant: "default",
  },
  variants: {
    size: {
      lg: "h-10 min-w-10 px-2.5", // 40px
      md: "h-9 min-w-9 px-2", // 36px
      sm: "h-8 min-w-8 px-1.5", // 32px
    },
    variant: {
      default: "hover:not-disabled:not-data-[state=on]:text-muted-foreground bg-transparent",
      outline:
        "border-input shadow-xs focus-visible:border-ring hover:not-disabled:not-data-[state=on]:text-secondary-foreground border",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toggleVariants };
