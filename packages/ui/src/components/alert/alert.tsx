import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { alertVariants } from "@/components/alert/alert.variants";
import { cn } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

interface AlertProps extends ComponentProps<"div">, VariantProps<typeof alertVariants> {}

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

type AlertTitleProps = ComponentProps<"div">;

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

type AlertDescriptionProps = ComponentProps<"div">;

function AlertDescription({ className, ...props }: AlertDescriptionProps): JSX.Element {
  return (
    <div
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Alert, AlertDescription, AlertTitle };
export type { AlertDescriptionProps, AlertProps, AlertTitleProps };
