import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { cn, tv } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Variant: Alert
 * -------------------------------------------------------------------------- */

const alertVariants = tv({
  base: "bg-card relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-xl border px-4 py-3 text-sm has-[>svg]:grid-cols-[--spacing(4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "text-card-foreground",
      destructive:
        "text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
    },
  },
});

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

export { alertVariants };
export { Alert, AlertDescription, AlertTitle };
export type { AlertDescriptionProps, AlertProps, AlertTitleProps };
