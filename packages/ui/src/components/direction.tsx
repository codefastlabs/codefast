import type { ComponentProps } from "react";

import type * as DirectionPrimitive from "@radix-ui/react-direction";

/* -----------------------------------------------------------------------------
 * Component: DirectionProvider
 * -------------------------------------------------------------------------- */

/**
 * Propagates a reading direction (`ltr` / `rtl`) to every descendant Radix
 * primitive, so components flip their layout and keyboard navigation without
 * each one having to thread a `dir` prop. Wrap an RTL subtree once near its
 * root. Renders no DOM element of its own — it only provides context.
 */
type DirectionProviderProps = ComponentProps<typeof DirectionPrimitive.DirectionProvider>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { DirectionProvider, useDirection } from "@radix-ui/react-direction";
export type { DirectionProviderProps };
