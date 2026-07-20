import * as AlertDialogPrimitive from "radix-ui/alert-dialog";
import type { ComponentProps, JSX } from "react";

import { Button } from "#/components/button";
import type { ButtonProps } from "#/components/button";
import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogProps = ComponentProps<typeof AlertDialogPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialog({ ...props }: AlertDialogProps): JSX.Element {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogTriggerProps = ComponentProps<typeof AlertDialogPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogTrigger({ ...props }: AlertDialogTriggerProps): JSX.Element {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface AlertDialogContentProps extends ComponentProps<typeof AlertDialogPrimitive.Content> {
  size?: "default" | "sm";
}

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogContent({ className, size = "default", ...props }: AlertDialogContentProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal">
      <AlertDialogPrimitive.Overlay
        className={
          "fixed inset-0 z-50 bg-black/10 ease-gentle supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:animation-duration-overlay-in data-open:fade-in-0 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-overlay-out data-closed:fade-out-0"
        }
        data-slot="alert-dialog-overlay"
      />
      <AlertDialogPrimitive.Content
        className={cn(
          "group/alert-dialog-content fixed inset-s-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 ease-ui outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg rtl:translate-x-1/2 data-open:animate-in data-open:animation-duration-overlay-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-overlay-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        data-size={size}
        data-slot="alert-dialog-content"
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "grid shrink-0 grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-start sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className,
      )}
      data-slot="alert-dialog-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogMedia
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogMediaProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogMedia({ className, ...props }: AlertDialogMediaProps): JSX.Element {
  return (
    <div
      className={cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className,
      )}
      data-slot="alert-dialog-media"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogBody
 * -------------------------------------------------------------------------- */

/**
 * Optional scrollable region for long content. When used, the Header and Footer
 * stay pinned (shrink-0) and only this body scrolls; without it, the whole
 * Content scrolls via its own max-height. A codefast enhancement over radix-vega.
 *
 * @since 0.3.16-canary.0
 */
type AlertDialogBodyProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogBody({ className, ...props }: AlertDialogBodyProps): JSX.Element {
  return (
    <div
      className={cn("-mx-6 min-h-0 flex-1 overflow-y-auto px-6", className)}
      data-slot="alert-dialog-body"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className,
      )}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogTitleProps = ComponentProps<typeof AlertDialogPrimitive.Title>;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Title
      className={cn(
        "font-heading text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className,
      )}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogPrimitive.Description>;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Description
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface AlertDialogActionProps
  extends ComponentProps<typeof AlertDialogPrimitive.Action>, Pick<ButtonProps, "size" | "variant"> {}

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogAction({ size = "default", variant = "default", ...props }: AlertDialogActionProps): JSX.Element {
  return (
    <Button asChild size={size} variant={variant}>
      <AlertDialogPrimitive.Action data-slot="alert-dialog-action" {...props} />
    </Button>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogCancel
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface AlertDialogCancelProps
  extends ComponentProps<typeof AlertDialogPrimitive.Cancel>, Pick<ButtonProps, "size" | "variant"> {}

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogCancel({ size = "default", variant = "outline", ...props }: AlertDialogCancelProps): JSX.Element {
  return (
    <Button asChild size={size} variant={variant}>
      <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" {...props} />
    </Button>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
};
export type {
  AlertDialogActionProps,
  AlertDialogBodyProps,
  AlertDialogCancelProps,
  AlertDialogContentProps,
  AlertDialogDescriptionProps,
  AlertDialogFooterProps,
  AlertDialogHeaderProps,
  AlertDialogMediaProps,
  AlertDialogProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps,
};
