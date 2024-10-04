import * as React from 'react';
import { Spinner } from '@/components/spinner';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

type ButtonElement = HTMLButtonElement;

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'>, ButtonVariantsProps {
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: React.ReactNode;
  spinner?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Button = React.forwardRef<ButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      icon,
      disabled,
      loading,
      prefix,
      suffix,
      loaderPosition = 'prefix',
      spinner,
      ...props
    },
    forwardedRef,
  ) => (
    <button
      ref={forwardedRef}
      className={buttonVariants({ className, icon, size, variant })}
      disabled={loading || disabled}
      type="button"
      {...props}
    >
      {loading && loaderPosition === 'prefix' ? spinner || <Spinner /> : prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {loading && loaderPosition === 'suffix' ? spinner || <Spinner /> : suffix}
    </button>
  ),
);

Button.displayName = 'Button';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button, type ButtonProps };
