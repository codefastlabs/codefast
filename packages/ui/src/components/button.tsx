import { Slot } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import type { ButtonVariants } from "#/variants/button";
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
function Button({ asChild = false, className, size, type = "button", variant, ...props }: ButtonProps): JSX.Element {
  const Comp = asChild ? Slot.Root : "button";

  if (asChild) {
    return (
      <Comp
        className={buttonVariants({ className, size, variant })}
        data-size={size}
        data-slot="button"
        data-variant={variant}
        {...props}
      />
    );
  }

  return (
    <button
      className={buttonVariants({ className, size, variant })}
      data-size={size}
      data-slot="button"
      data-variant={variant}
      type={type}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button };
export type { ButtonProps };
