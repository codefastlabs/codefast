import type { ComponentProps, JSX, ReactNode } from 'react';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { Spinner } from '@/components/spinner';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

interface ButtonProps extends Omit<ComponentProps<'button'>, 'prefix'>, ButtonVariantsProps {
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: ReactNode;
  spinner?: ReactNode;
  suffix?: ReactNode;
}

function Button({
  children,
  className,
  disabled,
  icon,
  inside,
  loaderPosition = 'prefix',
  loading,
  prefix,
  size,
  spinner,
  suffix,
  variant,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
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
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ButtonProps };
export { Button };
