import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Skeleton
 * -------------------------------------------------------------------------- */

function Skeleton({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <div className={cn('bg-muted animate-pulse rounded-lg', className)} data-slot="skeleton" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Skeleton };
