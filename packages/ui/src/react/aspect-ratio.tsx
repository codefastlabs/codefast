"use client";

import type * as React from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/* -----------------------------------------------------------------------------
 * Component: AspectRatio
 * -------------------------------------------------------------------------- */

type AspectRatioProps = React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>;
const AspectRatio = AspectRatioPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { AspectRatio, type AspectRatioProps };
