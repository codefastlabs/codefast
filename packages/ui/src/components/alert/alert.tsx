import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@/lib/utils";

import { alertVariants } from "@/components/alert/alert-variants";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>): JSX.Element {
  return <div className={alertVariants({ className, variant })} data-slot="alert" role="alert" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertTitle
 * -------------------------------------------------------------------------- */

function AlertTitle({ children, className, ...props }: ComponentProps<"div">): JSX.Element {
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

function AlertDescription({ className, ...props }: ComponentProps<"div">): JSX.Element {
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
