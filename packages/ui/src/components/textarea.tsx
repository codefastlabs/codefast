import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

type TextareaProps = ComponentProps<'textarea'>;

function Textarea({ className, ...props }: TextareaProps): JSX.Element {
  return (
    <textarea
      className={cn(
        [
          'border-input shadow-xs flex min-h-16 w-full grow rounded-md border bg-transparent px-3 py-2 text-sm transition',
          'hover:not-disabled:not-focus-visible:border-input-hover',
          'focus-visible:border-input-focus focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
          'placeholder:text-muted-foreground',
          'disabled:opacity-50',
        ],
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { TextareaProps };
export { Textarea };
