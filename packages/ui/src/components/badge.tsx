import type { ComponentProps, JSX, ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: 'shadow-xs inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 text-sm font-medium [&>svg]:shrink-0',
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
      default: 'bg-primary text-primary-foreground shadow-primary',
      secondary: 'bg-secondary shadow-secondary text-secondary-foreground',
      info: 'bg-info shadow-info text-info-foreground',
      success: 'bg-success shadow-success text-success-foreground',
      warning: 'bg-warning shadow-warning text-warning-foreground',
      destructive: 'bg-destructive shadow-destructive text-destructive-foreground',
      outline: 'bg-background border-input shadow-input border',
    },
  },
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
  compoundVariants: [
    {
      className: 'w-8',
      icon: true,
      size: 'sm',
    },
    {
      className: 'w-9',
      icon: true,
      size: 'md',
    },
    {
      className: 'w-10',
      icon: true,
      size: 'lg',
    },
    {
      className: 'w-11',
      icon: true,
      size: 'xl',
    },
    {
      className: 'w-12',
      icon: true,
      size: '2xl',
    },
  ],
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
