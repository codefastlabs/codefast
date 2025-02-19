import type { ComponentProps, JSX, ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

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
      '2xl': 'h-9 [&>svg]:size-5', // 36px
      lg: 'h-7 [&>svg]:size-4', // 28px
      md: 'h-6 [&>svg]:size-3', // 24px
      sm: 'h-5 [&>svg]:size-3', // 20px
      xl: 'h-8 [&>svg]:size-5', // 32px
    },
    variant: {
      default: 'bg-primary text-primary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      info: 'bg-info text-info-foreground',
      outline: 'bg-background border-input border',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
    },
  },
});

type BadgeVariantsProps = VariantProps<typeof badgeVariants>;

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

interface BadgeProps extends Omit<ComponentProps<'div'>, 'prefix'>, BadgeVariantsProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

function Badge({ children, className, prefix, size, suffix, variant, ...props }: BadgeProps): JSX.Element {
  return (
    <div className={badgeVariants({ className, size, variant })} {...props}>
      {prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { BadgeProps };
export { Badge };
