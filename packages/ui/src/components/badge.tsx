import { type HTMLAttributes, type JSX, type ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 text-sm font-medium',
    '[&>svg]:shrink-0',
  ],
  compoundVariants: [
    { className: 'w-8', icon: true, size: 'sm' },
    { className: 'w-9', icon: true, size: 'md' },
    { className: 'w-10', icon: true, size: 'lg' },
    { className: 'w-11', icon: true, size: 'xl' },
    { className: 'w-12', icon: true, size: '2xl' },
  ],
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
  variants: {
    icon: { false: '', true: 'px-0' },
    size: {
      sm: 'h-5 [&>svg]:size-3', // 20px
      md: 'h-6 [&>svg]:size-3', // 24px
      lg: 'h-7 [&>svg]:size-4', // 28px
      xl: 'h-8 [&>svg]:size-5', // 32px
      '2xl': 'h-9 [&>svg]:size-5', // 36px
    },
    variant: {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      info: 'bg-info text-info-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'bg-background border-input border',
    },
  },
});

type BadgeVariantsProps = VariantProps<typeof badgeVariants>;

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

interface BadgeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'prefix'>, BadgeVariantsProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

function Badge({ className, variant, size, prefix, suffix, children, ...props }: BadgeProps): JSX.Element {
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
