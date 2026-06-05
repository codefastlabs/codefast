import { Direction } from "radix-ui";
import type { ComponentProps } from "react";

/* -----------------------------------------------------------------------------
 * Component: DirectionProvider
 * -------------------------------------------------------------------------- */

type DirectionProviderProps = ComponentProps<typeof Direction.DirectionProvider> & {
  direction?: ComponentProps<typeof Direction.DirectionProvider>["dir"];
};

function DirectionProvider({ dir, direction, children }: DirectionProviderProps) {
  return (
    <Direction.DirectionProvider dir={direction ?? dir}>{children}</Direction.DirectionProvider>
  );
}

const useDirection = Direction.useDirection;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { DirectionProvider, useDirection };
export type { DirectionProviderProps };
