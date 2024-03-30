import * as React from "react";
import { type VariantProps } from "cva";
import { cva } from "./utils";

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = cva({
  base: "border-input focus-visible:ring-ring focus-visible:ring-offset-background placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    inputSize: {
      default: "h-10",
      xs: "h-8",
      sm: "h-9",
      lg: "h-11",
    },
  },
  defaultVariants: {
    inputSize: "default",
  },
});

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const Input = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> &
    VariantProps<typeof inputVariants>
>(({ className, inputSize, ...props }, ref) => {
  return (
    <input
      type="text"
      className={inputVariants({ className, inputSize })}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Input };
