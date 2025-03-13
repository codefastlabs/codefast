import type { ComponentProps, JSX, ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

import { Spinner } from '@/components/spinner';

/* -----------------------------------------------------------------------------
 * Variant: Button
 * -------------------------------------------------------------------------- */

const buttonVariants = tv({
  base: "focus-visible:ring-ring focus-visible:ring-3 outline-hidden inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  variants: {
    size: {
      sm: 'h-8 px-3 has-[>svg]:px-2.5', // 32px
      md: 'h-9 px-4 has-[>svg]:px-3', // 36px
      lg: 'h-10 px-6 has-[>svg]:px-4', // 40px
      icon: 'size-9',
    },
    variant: {
      default: 'bg-primary text-primary-foreground hover:not-disabled:bg-primary-hover',
      secondary: 'bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary-hover',
      destructive: 'bg-destructive text-destructive-foreground hover:not-disabled:bg-destructive-hover',
      outline:
        'border-input not-disabled:shadow-xs hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground focus-visible:border-border-focus border',
      ghost: 'hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground',
      link: 'text-primary hover:not-disabled:underline underline-offset-4',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

function Button({
  children,
  className,
  disabled,
  loaderPosition = 'prefix',
  loading,
  prefix,
  size,
  spinner,
  suffix,
  variant,
  ...props
}: Omit<ComponentProps<'button'>, 'prefix'> &
  VariantProps<typeof buttonVariants> & {
    loaderPosition?: 'prefix' | 'suffix';
    loading?: boolean;
    prefix?: ReactNode;
    spinner?: ReactNode;
    suffix?: ReactNode;
  }): JSX.Element {
  return (
    <button
      className={buttonVariants({ className, size, variant })}
      data-slot="button"
      data-variant={variant}
      disabled={loading || disabled}
      type="button"
      {...props}
    >
      {loading && loaderPosition === 'prefix' ? spinner || <Spinner /> : prefix}
      {children}
      {loading && loaderPosition === 'suffix' ? spinner || <Spinner /> : suffix}
    </button>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button, buttonVariants };
