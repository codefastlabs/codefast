import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Alert
 * -------------------------------------------------------------------------- */

const alertVariants = tv({
  base: '[&>svg+div]:-translate-y-0.75 relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-background text-foreground [&>svg]:text-foreground',
      destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      info: 'border-info/50 text-info dark:border-info [&>svg]:text-info',
      primary: 'border-primary/50 text-primary dark:border-primary [&>svg]:text-primary',
      success: 'border-success/50 text-success dark:border-success [&>svg]:text-success',
      warning: 'border-warning/50 text-warning dark:border-warning [&>svg]:text-warning',
    },
  },
});

type AlertVariantsProps = VariantProps<typeof alertVariants>;

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

type AlertProps = AlertVariantsProps & ComponentProps<'div'>;

function Alert({ className, variant, ...props }: AlertProps): JSX.Element {
  return <div className={alertVariants({ className, variant })} role="alert" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertTitle
 * -------------------------------------------------------------------------- */

type AlertTitleProps = ComponentProps<'h5'>;

function AlertTitle({ children, className, ...props }: AlertTitleProps): JSX.Element {
  return (
    <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props}>
      {children}
    </h5>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDescription
 * -------------------------------------------------------------------------- */

type AlertDescriptionProps = ComponentProps<'div'>;

function AlertDescription({ className, ...props }: AlertDescriptionProps): JSX.Element {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { AlertDescriptionProps, AlertProps, AlertTitleProps };
export { Alert, AlertDescription, AlertTitle };
