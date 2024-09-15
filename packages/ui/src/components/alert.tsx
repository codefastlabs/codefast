import * as React from 'react';
import { alertVariants, type AlertVariantsProps } from '@/styles/alert-variants';

/* -----------------------------------------------------------------------------
 * Variant: Alert
 * -------------------------------------------------------------------------- */

const { root, title, description } = alertVariants();

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

type AlertElement = HTMLDivElement;
type AlertProps = React.HTMLAttributes<HTMLDivElement> & AlertVariantsProps;

const Alert = React.forwardRef<AlertElement, AlertProps>(({ className, variant, ...props }, forwardedRef) => (
  <div ref={forwardedRef} className={root({ variant, className })} role="alert" {...props} />
));

Alert.displayName = 'Alert';

/* -----------------------------------------------------------------------------
 * Component: AlertTitle
 * -------------------------------------------------------------------------- */

type AlertTitleElement = HTMLHeadingElement;
type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const AlertTitle = React.forwardRef<AlertTitleElement, AlertTitleProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <h5 ref={forwardedRef} className={title({ className })} {...props}>
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
    <div ref={forwardedRef} className={description({ className })} {...props} />
  ),
);

AlertDescription.displayName = 'AlertDescription';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Alert, AlertTitle, AlertDescription, type AlertProps, type AlertTitleProps, type AlertDescriptionProps };
