import { Toggle as TogglePrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import type { ToggleVariants } from "#/variants/toggle";
import { toggleVariants } from "#/variants/toggle";

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface ToggleProps extends ComponentProps<typeof TogglePrimitive.Root>, ToggleVariants {}

/**
 * @since 0.3.16-canary.0
 */
function Toggle({ className, size, variant, ...props }: ToggleProps): JSX.Element {
  return (
    <TogglePrimitive.Root className={toggleVariants({ className, size, variant })} data-slot="toggle" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle };
export type { ToggleProps };
