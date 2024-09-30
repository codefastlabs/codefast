import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Textarea
 * -------------------------------------------------------------------------- */

const textareaVariants = tv({
  base: [
    'border-input flex min-h-16 w-full grow rounded-md border bg-transparent py-2 text-sm',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'placeholder:text-muted-foreground',
    'disabled:cursor-default disabled:opacity-50',
  ],
  variants: {
    inputSize: {
      xxs: 'px-2.5',
      xs: 'px-2.75',
      sm: 'px-3',
      md: 'px-3.25',
      lg: 'px-3.5',
      xl: 'px-3.75',
    },
  },
  defaultVariants: {
    inputSize: 'md',
  },
});

type TextareaVariantsProps = VariantProps<typeof textareaVariants>;

/* -----------------------------------------------------------------------------
 * Component: Textarea
 * -------------------------------------------------------------------------- */

type TextareaElement = HTMLTextAreaElement;
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, TextareaVariantsProps {}

const Textarea = React.forwardRef<TextareaElement, TextareaProps>(
  ({ className, inputSize, ...props }, forwardedRef) => (
    <textarea ref={forwardedRef} className={textareaVariants({ className, inputSize })} {...props} />
  ),
);

Textarea.displayName = 'Textarea';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Textarea, type TextareaProps };
