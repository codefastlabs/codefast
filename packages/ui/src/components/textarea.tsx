import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

function Textarea({ className, ...props }: ComponentProps<'textarea'>): JSX.Element {
  return (
    <textarea
      className={cn(
        'border-input bg-background hover:not-disabled:not-focus-visible:border-input-hover focus-visible:border-input-focus focus-visible:ring-ring focus-visible:ring-3 placeholder:text-muted-foreground not-disabled:shadow-xs outline-hidden flex min-h-16 w-full grow rounded-lg border px-3 py-2 text-sm transition disabled:opacity-50',
        className,
      )}
      data-slot="textarea"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Textarea };
