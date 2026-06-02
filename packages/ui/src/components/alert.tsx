import type { AlertVariants } from "#/variants/alert";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

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
  return (
    <div
      className={alertVariants({ className, variant })}
      data-slot="alert"
      role="alert"
      {...props}
    />
  );
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
function AlertTitle({ children, className, ...props }: AlertTitleProps): JSX.Element {
  return (
    <div
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      data-slot="alert-title"
      {...props}
    >
      {children}
    </div>
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
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
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
  return (
    <div
      className={cn("absolute top-2.5 right-3", className)}
      data-slot="alert-action"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Alert, AlertAction, AlertDescription, AlertTitle };
export type { AlertActionProps, AlertDescriptionProps, AlertProps, AlertTitleProps };
