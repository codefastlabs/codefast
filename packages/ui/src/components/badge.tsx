import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-md px-2.5 font-medium',
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
      xs: ['h-5', '[&>svg]:size-3', 'text-xs'], // 20px
      sm: ['h-6', '[&>svg]:size-3', 'text-xs'], // 24px
      md: ['h-7', '[&>svg]:size-4', 'text-sm'], // 28px
      lg: ['h-8', '[&>svg]:size-4', 'text-sm'], // 32px
      xl: ['h-9', '[&>svg]:size-4', 'text-sm'], // 36px
    },
    icon: {
      true: 'px-0',
    },
  },
  compoundVariants: [
    { className: 'size-8', icon: true, size: 'xs' },
    { className: 'size-9', icon: true, size: 'sm' },
    { className: 'size-10', icon: true, size: 'md' },
    { className: 'size-11', icon: true, size: 'lg' },
    { className: 'size-12', icon: true, size: 'xl' },
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
