import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

type TextareaElement = HTMLTextAreaElement;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<TextareaElement, TextareaProps>(
  ({ className, ...props }, forwardedRef) => (
    <textarea
      ref={forwardedRef}
      className={cn(
        [
          'border-input flex min-h-16 w-full grow rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm',
          'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
          'placeholder:text-muted-foreground',
          'disabled:cursor-default disabled:opacity-50',
        ],
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Textarea, type TextareaProps };
