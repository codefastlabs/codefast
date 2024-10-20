import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';
import { type ComponentPropsWithoutRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: AspectRatio
 * -------------------------------------------------------------------------- */

type AspectRatioProps = ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>;
const AspectRatio = AspectRatioPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { AspectRatio, type AspectRatioProps };
