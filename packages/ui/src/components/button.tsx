import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { tv, type VariantProps } from 'tailwind-variants';
import { Spinner } from '@/components/spinner';

/* -----------------------------------------------------------------------------
 * Variant: Button
 * -------------------------------------------------------------------------- */

const buttonVariants = tv({
  base: 'inline-flex select-none items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
      outline:
        'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground border shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
    },
    size: {
      '2xs': 'h-7 gap-1 px-2',
      xs: 'h-8 gap-1 px-2',
      sm: 'h-9 gap-2 px-3',
      default: 'h-10 gap-2 px-4',
      lg: 'h-11 gap-2 px-8',
      icon: 'size-10',
      'icon-2xs': 'size-7',
      'icon-xs': 'size-8',
      'icon-sm': 'size-9',
      'icon-lg': 'size-11',
    },
    loading: {
      true: 'relative',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
    loading: false,
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

type ButtonElement = HTMLButtonElement;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantsProps {
  asChild?: boolean;
}

const Button = React.forwardRef<ButtonElement, ButtonProps>(
  ({ children, className, variant, size, loading = false, asChild = false, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'button';
    const ComponentLoading = asChild ? 'span' : React.Fragment;
    const disabled = loading || props.disabled;

    return (
      <Component
        ref={forwardedRef}
        className={buttonVariants({ variant, size, loading, className })}
        type={asChild ? undefined : 'button'}
        {...props}
        disabled={disabled}
      >
        {loading ? (
          <ComponentLoading>
            <span aria-hidden className="invisible contents">
              {children}
            </span>
            <VisuallyHidden>{children}</VisuallyHidden>
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </span>
          </ComponentLoading>
        ) : (
          children
        )}
      </Component>
    );
  },
);

Button.displayName = 'Button';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button, buttonVariants, type ButtonProps, type ButtonVariantsProps };
