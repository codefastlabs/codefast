import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

function Textarea({ className, ...props }: ComponentProps<'textarea'>): JSX.Element {
  return (
    <textarea
      className={cn(
        'border-input hover:not-disabled:not-focus-visible:border-ring/60 focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-3 placeholder:text-muted-foreground not-disabled:shadow-xs outline-hidden aria-invalid:border-destructive hover:not-disabled:not-focus-within:aria-invalid:border-destructive/60 focus-within:aria-invalid:ring-destructive/20 flex min-h-16 w-full grow rounded-lg border px-3 py-2 text-base transition disabled:opacity-50 md:text-sm',
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
