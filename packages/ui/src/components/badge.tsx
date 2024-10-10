import { type HTMLAttributes, type JSX, type ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 font-medium',
    '[&>svg]:shrink-0',
  ],
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
  variants: {
    icon: { false: '', true: 'px-0' },
    size: {
      xs: ['h-5', '[&>svg]:size-3', 'text-xs'], // 20px
      sm: ['h-6', '[&>svg]:size-3', 'text-xs'], // 24px
      md: ['h-7', '[&>svg]:size-4', 'text-sm'], // 28px
      lg: ['h-8', '[&>svg]:size-4', 'text-sm'], // 32px
      xl: ['h-9', '[&>svg]:size-4', 'text-sm'], // 36px
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

interface BadgeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'prefix'>,
    BadgeVariantsProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

function Badge({
  className,
  variant,
  size,
  prefix,
  suffix,
  children,
  ...props
}: BadgeProps): JSX.Element {
  return (
    <div className={badgeVariants({ variant, className, size })} {...props}>
      {prefix}
      {typeof children === 'string' ? (
        <span className="truncate">{children}</span>
      ) : (
        children
      )}
      {suffix}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge, type BadgeProps };
