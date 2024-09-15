import * as React from 'react';
import { textareaVariants, type TextareaVariantsProps } from '@/styles/textarea-variants';

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
