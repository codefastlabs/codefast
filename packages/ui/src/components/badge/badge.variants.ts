import { tv } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: "focus-visible:ring-ring/50 focus-visible:ring-3 outline-hidden inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-medium transition [&>svg]:size-3 [&>svg]:shrink-0",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default:
        "bg-primary [a&]:hover:bg-primary/80 text-primary-foreground focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40 border-transparent",
      destructive:
        "bg-destructive dark:bg-destructive/60 [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 border-transparent text-white",
      outline:
        "bg-background border-input [a&]:hover:bg-accent [a&]:hover:text-accent-foreground [a&]:hover:border-ring/60 focus-visible:border-ring",
      secondary:
        "bg-secondary [a&]:hover:bg-secondary/80 text-secondary-foreground border-transparent",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { badgeVariants };
