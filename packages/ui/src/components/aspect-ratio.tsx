import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';
import type * as React from 'react';

/* -----------------------------------------------------------------------------
 * Component: AspectRatio
 * -------------------------------------------------------------------------- */

type AspectRatioProps = React.ComponentPropsWithoutRef<
  typeof AspectRatioPrimitive.Root
>;
const AspectRatio = AspectRatioPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { AspectRatio, type AspectRatioProps };
