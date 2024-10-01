import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
    '[&>svg]:shrink-0',
  ],
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      info: 'bg-info text-info-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'bg-background border-input border',
    },
    size: {
      xs: 'h-5 px-2 [&>svg]:size-3', // 20px
      sm: 'h-6 px-2.5 [&>svg]:size-3', // 24px
      md: 'h-7 px-3 [&>svg]:size-3', // 28px
      lg: 'h-8 px-3.5 [&>svg]:size-3', // 32px
      xl: 'h-9 px-3.5 [&>svg]:size-4', // 36px
    },
    icon: {
      true: 'px-0',
    },
  },
  compoundVariants: [
    { className: 'w-8', icon: true, size: 'xs' },
    { className: 'w-9', icon: true, size: 'sm' },
    { className: 'w-10', icon: true, size: 'md' },
    { className: 'w-11', icon: true, size: 'lg' },
    { className: 'w-12', icon: true, size: 'xl' },
  ],
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
});

type BadgeVariantsProps = VariantProps<typeof badgeVariants>;

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

interface BadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'prefix'>, BadgeVariantsProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

function Badge({ className, variant, size, prefix, suffix, children, ...props }: BadgeProps): React.JSX.Element {
  return (
    <div className={badgeVariants({ variant, className, size })} {...props}>
      {prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge, type BadgeProps };
