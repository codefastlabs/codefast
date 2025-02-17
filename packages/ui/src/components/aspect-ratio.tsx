import type { ComponentProps } from 'react';

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

/* -----------------------------------------------------------------------------
 * Component: AspectRatio
 * -------------------------------------------------------------------------- */

type AspectRatioProps = ComponentProps<typeof AspectRatioPrimitive.Root>;
const AspectRatio = AspectRatioPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { AspectRatioProps };
export { AspectRatio };
