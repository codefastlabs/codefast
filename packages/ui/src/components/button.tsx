import type { ButtonVariants } from "#/variants/button";
import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

import { buttonVariants } from "#/variants/button";

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ButtonProps = ComponentProps<"button"> &
  ButtonVariants & {
    asChild?: boolean;
    type?: ComponentProps<"button">["type"];
  };

/**
 * @since 0.3.16-canary.0
 */
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

export { Button };
export type { ButtonProps };
