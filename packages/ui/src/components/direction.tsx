import { Direction } from "radix-ui";
import type { ComponentProps } from "react";

/* -----------------------------------------------------------------------------
 * Component: DirectionProvider
 * -------------------------------------------------------------------------- */

/**
 * @since 0.4.0-canary.4
 */
type DirectionProviderProps = ComponentProps<typeof Direction.DirectionProvider> & {
  direction?: ComponentProps<typeof Direction.DirectionProvider>["dir"];
};

/**
 * @since 0.4.0-canary.4
 */
function DirectionProvider({ dir, direction, children }: DirectionProviderProps) {
  return <Direction.DirectionProvider dir={direction ?? dir}>{children}</Direction.DirectionProvider>;
}

/**
 * @since 0.4.0-canary.4
 */
const useDirection = Direction.useDirection;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { DirectionProvider, useDirection };
export type { DirectionProviderProps };
