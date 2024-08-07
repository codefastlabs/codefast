import * as React from 'react';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

type TextareaElement = HTMLTextAreaElement;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<TextareaElement, TextareaProps>(({ className, ...props }, forwardedRef) => {
  return (
    <textarea
      ref={forwardedRef}
      className={cn(
        'border-input placeholder:text-muted-foreground flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Textarea, type TextareaProps };
