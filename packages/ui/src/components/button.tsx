import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';

import { Spinner } from '@/components/spinner';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

type ButtonElement = HTMLButtonElement;
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'>, ButtonVariantsProps {
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: ReactNode;
  spinner?: ReactNode;
  suffix?: ReactNode;
}

const Button = forwardRef<ButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      icon,
      inside,
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
      className={buttonVariants({
        className,
        icon,
        inside,
        size,
        variant,
      })}
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
