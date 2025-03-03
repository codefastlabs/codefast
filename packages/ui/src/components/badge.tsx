import type { ComponentProps, JSX, ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold [&>svg]:shrink-0',
  variants: {
    icon: { false: '', true: 'px-0' },
    size: {
      xs: 'px-2.25 h-5 text-xs [&>svg]:size-3', // 20px
      sm: 'h-6 px-2.5 text-xs [&>svg]:size-3', // 24px
      md: 'px-2.75 h-7 text-sm [&>svg]:size-4', // 28px
      lg: 'h-8 px-3 text-sm [&>svg]:size-5', // 32px
      xl: 'px-3.25 h-9 text-sm [&>svg]:size-5', // 36px
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
  defaultVariants: {
    icon: false,
    size: 'sm',
    variant: 'default',
  },
  compoundVariants: [
    {
      className: 'w-8',
      icon: true,
      size: 'xs',
    },
    {
      className: 'w-9',
      icon: true,
      size: 'sm',
    },
    {
      className: 'w-10',
      icon: true,
      size: 'md',
    },
    {
      className: 'w-11',
      icon: true,
      size: 'lg',
    },
    {
      className: 'w-12',
      icon: true,
      size: 'xl',
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
