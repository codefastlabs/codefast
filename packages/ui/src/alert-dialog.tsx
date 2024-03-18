import {
  Action,
  type AlertDialogActionProps as ActionProps,
  type AlertDialogCancelProps as CancelProps,
  type AlertDialogContentProps as ContentProps,
  type AlertDialogDescriptionProps as DescriptionProps,
  type AlertDialogOverlayProps as OverlayProps,
  type AlertDialogTitleProps as TitleProps,
  Cancel,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from "@radix-ui/react-alert-dialog";
import { forwardRef } from "react";
import { buttonVariants } from "./button";
import { cx } from "./cva";

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

const AlertDialog = Root;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

const AlertDialogTrigger = Trigger;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogPortal
 * -------------------------------------------------------------------------- */

const AlertDialogPortal = Portal;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogOverlay
 * -------------------------------------------------------------------------- */

type AlertDialogOverlayProps = OverlayProps;

const AlertDialogOverlay = forwardRef<
  React.ElementRef<typeof Overlay>,
  AlertDialogOverlayProps
>(({ className, ...props }, ref) => (
  <Overlay
    className={cx(
      "fixed inset-0 z-50 bg-black/80",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));

AlertDialogOverlay.displayName = Overlay.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

type AlertDialogContentProps = ContentProps;

const AlertDialogContent = forwardRef<
  React.ElementRef<typeof Content>,
  AlertDialogContentProps
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <Content
      ref={ref}
      className={cx(
        "bg-background fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-top-[48%] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
));

AlertDialogContent.displayName = Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogHeader
 * -------------------------------------------------------------------------- */

type AlertDialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogHeader({
  className,
  ...props
}: AlertDialogHeaderProps): React.JSX.Element {
  return (
    <div
      className={cx(
        "flex flex-col space-y-2 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

type AlertDialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogFooter({
  className,
  ...props
}: AlertDialogFooterProps): React.JSX.Element {
  return (
    <div
      className={cx(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTitle
 * -------------------------------------------------------------------------- */

type AlertDialogTitleProps = TitleProps;

const AlertDialogTitle = forwardRef<
  React.ElementRef<typeof Title>,
  AlertDialogTitleProps
>(({ className, ...props }, ref) => (
  <Title
    ref={ref}
    className={cx("text-lg font-semibold", className)}
    {...props}
  />
));

AlertDialogTitle.displayName = Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogDescription
 * -------------------------------------------------------------------------- */

type AlertDialogDescriptionProps = DescriptionProps;

const AlertDialogDescription = forwardRef<
  React.ElementRef<typeof Description>,
  AlertDialogDescriptionProps
>(({ className, ...props }, ref) => (
  <Description
    ref={ref}
    className={cx("text-muted-foreground text-sm", className)}
    {...props}
  />
));

AlertDialogDescription.displayName = Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

type AlertDialogActionProps = ActionProps;

const AlertDialogAction = forwardRef<
  React.ElementRef<typeof Action>,
  AlertDialogActionProps
>(({ className, ...props }, ref) => (
  <Action ref={ref} className={buttonVariants({ className })} {...props} />
));

AlertDialogAction.displayName = Action.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogCancel
 * -------------------------------------------------------------------------- */

type AlertDialogCancelProps = CancelProps;

const AlertDialogCancel = forwardRef<
  React.ElementRef<typeof Cancel>,
  AlertDialogCancelProps
>(({ className, ...props }, ref) => (
  <Cancel
    ref={ref}
    className={buttonVariants({ variant: "outline", className })}
    {...props}
  />
));

AlertDialogCancel.displayName = Cancel.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
