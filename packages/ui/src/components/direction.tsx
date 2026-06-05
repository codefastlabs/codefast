import type { FC, ReactNode } from "react";

import { Direction } from "radix-ui";

/* -----------------------------------------------------------------------------
 * Component: DirectionProvider
 * -------------------------------------------------------------------------- */

type TextDirection = "ltr" | "rtl";

/**
 * Propagates a reading direction (`ltr` / `rtl`) to every descendant Radix
 * primitive, so components flip their layout and keyboard navigation without
 * each one having to thread a `dir` prop. Wrap an RTL subtree once near its
 * root. Renders no DOM element of its own — it only provides context.
 */
interface DirectionProviderProps {
  children?: ReactNode;
  dir: TextDirection;
}

const DirectionProvider: FC<DirectionProviderProps> = Direction.DirectionProvider;

function useDirection(localDir?: TextDirection): TextDirection {
  return Direction.useDirection(localDir);
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { DirectionProvider, useDirection };
export type { DirectionProviderProps };
