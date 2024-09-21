import * as React from 'react';
import { cn } from '@/lib/utils';
import { alertVariants, type AlertVariantsProps } from '@/styles/alert-variants';

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

type AlertElement = HTMLDivElement;
type AlertProps = React.HTMLAttributes<HTMLDivElement> & AlertVariantsProps;

const Alert = React.forwardRef<AlertElement, AlertProps>(({ className, variant, ...props }, forwardedRef) => (
  <div ref={forwardedRef} className={alertVariants({ variant, className })} role="alert" {...props} />
));

Alert.displayName = 'Alert';

/* -----------------------------------------------------------------------------
 * Component: AlertTitle
 * -------------------------------------------------------------------------- */

type AlertTitleElement = HTMLHeadingElement;
type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const AlertTitle = React.forwardRef<AlertTitleElement, AlertTitleProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <h5 ref={forwardedRef} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props}>
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

const AlertDescription = React.forwardRef<AlertDescriptionElement, AlertDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
  ),
);

AlertDescription.displayName = 'AlertDescription';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Alert, AlertTitle, AlertDescription, type AlertProps, type AlertTitleProps, type AlertDescriptionProps };
