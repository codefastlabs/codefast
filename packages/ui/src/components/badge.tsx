import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    '[&_svg]:size-4 [&_svg]:shrink-0',
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
      xs: 'h-5 gap-2 px-2', // 20px
      sm: 'h-6 gap-2.5 px-2.5', // 24px
      md: 'h-7 gap-3 px-3', // 28px
      lg: 'h-8 gap-3.5 px-3.5', // 32px
      xl: 'h-9 gap-3.5 px-3.5', // 36px
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
