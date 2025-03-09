import type { ComponentProps, JSX, ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

import { Spinner } from '@/components/spinner';

/* -----------------------------------------------------------------------------
 * Variant: Button
 * -------------------------------------------------------------------------- */

const buttonVariants = tv({
  base: "focus-visible:ring-ring focus-visible:ring-3 inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium outline-none transition-[color,box-shadow,border-color,background-color] disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  variants: {
    icon: { false: '', true: 'px-0' },
    inside: { false: '', true: '' },
    size: {
      '2xs': 'h-7 px-3 text-xs', // 28px
      xs: 'h-8 px-3 text-xs', // 32px
      sm: 'h-9 px-4 text-sm', // 36px
      md: 'h-10 px-4 text-sm', // 40px
      lg: 'h-11 px-4 text-sm', // 44px
      xl: 'h-12 px-4 text-sm', // 48px
    },
    variant: {
      default: 'bg-primary text-primary-foreground hover:not-disabled:bg-primary-hover',
      secondary: 'bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary-hover',
      destructive: 'bg-destructive text-destructive-foreground hover:not-disabled:bg-destructive-hover',
      outline:
        'border-input not-disabled:shadow-xs hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground focus-visible:border-input-focus border',
      ghost: 'hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground',
      link: 'text-primary hover:not-disabled:underline underline-offset-4',
    },
  },
  defaultVariants: {
    icon: false,
    inside: false,
    size: 'md',
    variant: 'default',
  },
  compoundVariants: [
    { className: 'w-7', icon: true, size: '2xs' },
    { className: 'w-8', icon: true, size: 'xs' },
    { className: 'w-9', icon: true, size: 'sm' },
    { className: 'w-10', icon: true, size: 'md' },
    { className: 'w-11', icon: true, size: 'lg' },
    { className: 'w-12', icon: true, size: 'xl' },

    { className: 'h-5', inside: true, size: '2xs' },
    { className: 'h-6', inside: true, size: 'xs' },
    { className: 'h-7', inside: true, size: 'sm' },
    { className: 'h-8', inside: true, size: 'md' },
    { className: 'h-9', inside: true, size: 'lg' },
    { className: 'h-10', inside: true, size: 'xl' },

    { className: 'w-5', icon: true, inside: true, size: '2xs' },
    { className: 'w-6', icon: true, inside: true, size: 'xs' },
    { className: 'w-7', icon: true, inside: true, size: 'sm' },
    { className: 'w-8', icon: true, inside: true, size: 'md' },
    { className: 'w-9', icon: true, inside: true, size: 'lg' },
    { className: 'w-10', icon: true, inside: true, size: 'xl' },
  ],
});

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

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
      className={buttonVariants({ className, icon, inside, size, variant })}
      data-slot="button"
      data-variant={variant}
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

export { Button, buttonVariants };
