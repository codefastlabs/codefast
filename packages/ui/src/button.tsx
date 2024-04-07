import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "cva";
import { Spinner } from "./spinner";
import { cva } from "./utils";

/* -----------------------------------------------------------------------------
 * Variant: Button
 * -------------------------------------------------------------------------- */

const buttonVariants = cva({
  base: [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  ],
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      outline: "border-input bg-background hover:bg-accent hover:text-accent-foreground border shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
    },
    size: {
      default: "h-10 px-4",
      xs: "h-8 px-2",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
      icon: "size-10",
      "icon-xs": "size-8",
      "icon-sm": "size-9",
      "icon-lg": "size-11",
    },
    loading: {
      true: "relative",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
    loading: false,
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

type ButtonElement = HTMLButtonElement;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantsProps {
  asChild?: boolean;
}

const Button = React.forwardRef<ButtonElement, ButtonProps>(
  ({ children, className, variant, size, loading = false, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const disabled = loading || props.disabled;

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : "button"}
        className={buttonVariants({ variant, size, loading, className })}
        {...props}
        disabled={disabled}
      >
        {loading ? (
          <>
            <span
              aria-hidden
              className="invisible contents"
              // Workaround to use `inert` until https://github.com/facebook/react/pull/24730 is merged.
              {...{ inert: "" }}
            >
              {children}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button, buttonVariants, type ButtonProps, type ButtonVariantsProps };
