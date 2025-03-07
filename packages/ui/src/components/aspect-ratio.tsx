import type { ComponentProps, JSX } from 'react';

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

/* -----------------------------------------------------------------------------
 * Component: AspectRatio
 * -------------------------------------------------------------------------- */

type AspectRatioProps = ComponentProps<typeof AspectRatioPrimitive.Root>;

function AspectRatio({ ...props }: AspectRatioProps): JSX.Element {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { AspectRatioProps };
export { AspectRatio };
