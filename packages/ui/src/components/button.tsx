import * as React from 'react';
import { Spinner } from '@/components/spinner';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

type ButtonElement = HTMLButtonElement;

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'>, ButtonVariantsProps {
  loading?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Button = React.forwardRef<ButtonElement, ButtonProps>(
  ({ children, className, variant, size, shape, disabled, loading, prefix, suffix, ...props }, forwardedRef) => (
    <button
      ref={forwardedRef}
      className={buttonVariants({ className, shape, size, variant })}
      disabled={loading || disabled}
      type="button"
      {...props}
    >
      {loading ? <Spinner /> : prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </button>
  ),
);

Button.displayName = 'Button';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button, type ButtonProps };
