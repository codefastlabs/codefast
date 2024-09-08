import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { Spinner } from '@/components/spinner';

/* -----------------------------------------------------------------------------
 * Variant: Button
 * -------------------------------------------------------------------------- */

const buttonVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition [&_svg]:shrink-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:opacity-50',
  ],
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground [&:not([disabled])]:hover:bg-primary/80',
      secondary: 'bg-secondary text-secondary-foreground [&:not([disabled])]:hover:bg-secondary/80',
      info: 'bg-info text-info-foreground [&:not([disabled])]:hover:bg-info/80',
      success: 'bg-success text-success-foreground [&:not([disabled])]:hover:bg-success/80',
      warning: 'bg-warning text-warning-foreground [&:not([disabled])]:hover:bg-warning/80',
      destructive: 'bg-destructive text-destructive-foreground [&:not([disabled])]:hover:bg-destructive/80',
      outline:
        '[&:not([disabled])]:hover:bg-accent [&:not([disabled])]:hover:text-accent-foreground border-input border',
      ghost: '[&:not([disabled])]:hover:bg-accent [&:not([disabled])]:hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 [&:not([disabled])]:hover:underline',
    },
    size: {
      xxs: 'h-7 px-2 [&_svg]:size-3',
      xs: 'h-8 px-2 [&_svg]:size-3',
      sm: 'h-9 px-3 [&_svg]:size-4',
      md: 'h-10 px-4 [&_svg]:size-4',
      lg: 'h-11 px-8 [&_svg]:size-5',
      xl: 'h-12 px-10 [&_svg]:size-5',
    },
    shape: {
      rectangle: '',
      square: '',
      circle: 'rounded-full',
    },
    loading: {
      true: 'relative',
    },
  },
  compoundVariants: [
    { size: 'xxs', shape: ['square', 'circle'], className: 'w-7 px-0' },
    { size: 'xs', shape: ['square', 'circle'], className: 'w-8 px-0' },
    { size: 'sm', shape: ['square', 'circle'], className: 'w-9 px-0' },
    { size: 'md', shape: ['square', 'circle'], className: 'w-10 px-0' },
    { size: 'lg', shape: ['square', 'circle'], className: 'w-11 px-0' },
    { size: 'xl', shape: ['square', 'circle'], className: 'w-12 px-0' },
  ],
  defaultVariants: {
    loading: false,
    shape: 'rectangle',
    size: 'md',
    variant: 'default',
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

type ButtonElement = HTMLButtonElement;

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'>, ButtonVariantsProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Button = React.forwardRef<ButtonElement, ButtonProps>(
  ({ children, className, variant, size, shape, disabled, loading, prefix, suffix, ...props }, forwardedRef) => (
    <button
      ref={forwardedRef}
      className={buttonVariants({ className, loading, shape, size, variant })}
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

export { Button, buttonVariants, type ButtonProps, type ButtonVariantsProps };
