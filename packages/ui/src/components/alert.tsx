import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Alert
 * -------------------------------------------------------------------------- */

const alertVariants = tv({
  base: '[&>svg+div]:-translate-y-0.75 relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  variants: {
    variant: {
      default: 'bg-background text-foreground [&>svg]:text-foreground',
      destructive:
        'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type AlertVariantsProps = VariantProps<typeof alertVariants>;

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

type AlertElement = HTMLDivElement;
type AlertProps = React.HTMLAttributes<HTMLDivElement> & AlertVariantsProps;

const Alert = React.forwardRef<AlertElement, AlertProps>(
  ({ className, variant, ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={alertVariants({ variant, className })}
      role="alert"
      {...props}
    />
  ),
);

Alert.displayName = 'Alert';

/* -----------------------------------------------------------------------------
 * Component: AlertTitle
 * -------------------------------------------------------------------------- */

type AlertTitleElement = HTMLHeadingElement;
type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const AlertTitle = React.forwardRef<AlertTitleElement, AlertTitleProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <h5
      ref={forwardedRef}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  ),
);

AlertTitle.displayName = 'AlertTitle';

/* -----------------------------------------------------------------------------
 * Component: AlertDescription
 * -------------------------------------------------------------------------- */

type AlertDescriptionElement = HTMLDivElement;
type AlertDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

const AlertDescription = React.forwardRef<
  AlertDescriptionElement,
  AlertDescriptionProps
>(({ className, ...props }, forwardedRef) => (
  <div
    ref={forwardedRef}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));

AlertDescription.displayName = 'AlertDescription';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Alert,
  AlertTitle,
  AlertDescription,
  type AlertProps,
  type AlertTitleProps,
  type AlertDescriptionProps,
};
