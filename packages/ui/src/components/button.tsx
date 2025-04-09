import type { ComponentProps, JSX, ReactNode } from 'react';

import type { VariantProps } from '@/lib/utils';

import { Spinner } from '@/components/spinner';
import { tv } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Button
 * -------------------------------------------------------------------------- */

const buttonVariants = tv({
  base: "focus-visible:ring-3 outline-hidden inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  variants: {
    size: {
      sm: 'h-8 px-3 has-[>svg]:px-2.5', // 32px
      md: 'h-9 px-4 has-[>svg]:px-3', // 36px
      lg: 'h-10 px-6 has-[>svg]:px-4', // 40px
      icon: 'size-9',
    },
    variant: {
      default:
        'bg-primary text-primary-foreground focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40 hover:not-disabled:bg-primary/80',
      secondary: 'bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary/80 focus-visible:ring-ring/50',
      destructive:
        'bg-destructive dark:bg-destructive/60 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 hover:not-disabled:bg-destructive/90 text-white',
      outline:
        'border-input shadow-xs hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground focus-visible:ring-ring/50 focus-visible:border-ring aria-invalid:border-destructive dark:aria-invalid:border-destructive/70 hover:not-disabled:aria-invalid:border-destructive/60 focus-within:aria-invalid:ring-destructive/20 dark:focus-within:aria-invalid:ring-destructive/40 dark:bg-input/30 dark:hover:not-disabled:bg-input/50 hover:not-disabled:border-ring/60 border',
      ghost:
        'hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground focus-visible:ring-ring/50 dark:hover:not-disabled:bg-secondary/50',
      link: 'text-primary hover:not-disabled:underline focus-visible:ring-ring/50 underline-offset-4',
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
