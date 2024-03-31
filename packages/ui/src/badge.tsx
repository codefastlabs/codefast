import { type VariantProps } from "cva";
import { cva } from "./utils";

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = cva({
  base: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground border-transparent shadow",
      secondary: "bg-secondary text-secondary-foreground border-transparent",
      destructive:
        "bg-destructive text-destructive-foreground border-transparent shadow",
      outline: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>): React.JSX.Element {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge };
