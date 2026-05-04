"use client";

import type { ComponentProps, JSX } from "react";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/* -----------------------------------------------------------------------------
 * Component: AspectRatio
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AspectRatioProps = ComponentProps<typeof AspectRatioPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function AspectRatio({ ...props }: AspectRatioProps): JSX.Element {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { AspectRatio };
export type { AspectRatioProps };
