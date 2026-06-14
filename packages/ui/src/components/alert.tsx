import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import type { AlertVariants } from "#/variants/alert";
import { alertVariants } from "#/variants/alert";

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface AlertProps extends ComponentProps<"div">, AlertVariants {}

/**
 * @since 0.3.16-canary.0
 */
function Alert({ className, variant, ...props }: AlertProps): JSX.Element {
  return <div className={alertVariants({ className, variant })} data-slot="alert" role="alert" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertTitleProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertTitle({ className, ...props }: AlertTitleProps): JSX.Element {
  return (
    <div
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className,
      )}
      data-slot="alert-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDescriptionProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDescription({ className, ...props }: AlertDescriptionProps): JSX.Element {
  return (
    <div
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertAction
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertActionProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertAction({ className, ...props }: AlertActionProps): JSX.Element {
  return <div className={cn("absolute end-3 top-2.5", className)} data-slot="alert-action" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Alert, AlertAction, AlertDescription, AlertTitle };
export type { AlertActionProps, AlertDescriptionProps, AlertProps, AlertTitleProps };
