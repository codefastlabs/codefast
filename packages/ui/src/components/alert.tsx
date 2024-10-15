import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

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
      destructive:
        'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    },
  },
});

type AlertVariantsProps = VariantProps<typeof alertVariants>;

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

type AlertElement = HTMLDivElement;
type AlertProps = HTMLAttributes<HTMLDivElement> & AlertVariantsProps;

const Alert = forwardRef<AlertElement, AlertProps>(
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
type AlertTitleProps = HTMLAttributes<HTMLHeadingElement>;

const AlertTitle = forwardRef<AlertTitleElement, AlertTitleProps>(
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
type AlertDescriptionProps = HTMLAttributes<HTMLDivElement>;

const AlertDescription = forwardRef<
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
  AlertDescription,
  AlertTitle,
  type AlertDescriptionProps,
  type AlertProps,
  type AlertTitleProps,
};
