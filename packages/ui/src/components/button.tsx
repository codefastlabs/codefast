import type { VariantProps } from "#lib/utils";
import type { ComponentProps, JSX } from "react";

import { tv } from "#lib/utils";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Variant: Button
 * -------------------------------------------------------------------------- */

const buttonVariants = tv({
  base: "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap outline-hidden transition select-none focus-visible:ring-3 disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  defaultVariants: {
    size: "md",
    variant: "default",
  },
  variants: {
    size: {
      // 32px
      "icon-sm": "size-8",

      // 36px
      icon: "size-9",

      // 40px
      "icon-lg": "size-10",

      // 32px
      sm: "h-8 px-3 has-[>svg]:px-2.5",

      // 36px
      md: "h-9 px-4 has-[>svg]:px-3",

      // 40px
      lg: "h-10 px-6 has-[>svg]:px-4",
    },
    variant: {
      default:
        "bg-primary text-primary-foreground hover:not-disabled:bg-primary/80 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40",
      destructive:
        "bg-destructive text-white hover:not-disabled:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
      ghost:
        "hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground focus-visible:ring-ring/50 dark:hover:not-disabled:bg-secondary/50",
      link: "text-primary underline-offset-4 hover:not-disabled:underline focus-visible:ring-ring/50",
      outline:
        "border border-input shadow-xs hover:not-disabled:border-ring/60 hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive focus-within:aria-invalid:ring-destructive/20 hover:not-disabled:aria-invalid:border-destructive/60 dark:bg-input/30 dark:hover:not-disabled:bg-input/50 dark:aria-invalid:border-destructive/70 dark:focus-within:aria-invalid:ring-destructive/40",
      secondary:
        "bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary/80 focus-visible:ring-ring/50",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    type?: ComponentProps<"button">["type"];
  };

function Button({
  asChild = false,
  children,
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps): JSX.Element {
  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Comp
        className={buttonVariants({ className, size, variant })}
        data-slot="button"
        data-variant={variant}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      className={buttonVariants({ className, size, variant })}
      data-slot="button"
      data-variant={variant}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { buttonVariants };
export { Button };
export type { ButtonProps };
