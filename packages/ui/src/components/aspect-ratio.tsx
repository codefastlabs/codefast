import type { ComponentPropsWithoutRef } from 'react';

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

/* -----------------------------------------------------------------------------
 * Component: AspectRatio
 * -------------------------------------------------------------------------- */

type AspectRatioProps = ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>;
const AspectRatio = AspectRatioPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { AspectRatioProps };
export { AspectRatio };
