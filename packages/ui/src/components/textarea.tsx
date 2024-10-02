import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Textarea
 * -------------------------------------------------------------------------- */

const textareaVariants = tv({
  base: [
    'border-input flex min-h-16 w-full grow rounded-md border bg-transparent px-3 py-2 text-sm',
    'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
    'placeholder:text-muted-foreground',
    'disabled:cursor-default disabled:opacity-50',
  ],
});

type TextareaVariantsProps = VariantProps<typeof textareaVariants>;

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

type TextareaElement = HTMLTextAreaElement;
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, TextareaVariantsProps {}

const Textarea = React.forwardRef<TextareaElement, TextareaProps>(({ className, ...props }, forwardedRef) => (
  <textarea ref={forwardedRef} className={textareaVariants({ className })} {...props} />
));

Textarea.displayName = 'Textarea';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Textarea, type TextareaProps };
