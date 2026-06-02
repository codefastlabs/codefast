import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { buttonVariants } from "#/variants/button";

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Dialog({ ...props }: DialogProps): JSX.Element {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function DialogTrigger({ ...props }: DialogTriggerProps): JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogPortal
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogPortalProps = ComponentProps<typeof DialogPrimitive.Portal>;

/**
 * @since 0.3.16-canary.0
 */
function DialogPortal({ ...props }: DialogPortalProps): JSX.Element {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogOverlay
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogOverlayProps = ComponentProps<typeof DialogPrimitive.Overlay>;

/**
 * @since 0.3.16-canary.0
 */
function DialogOverlay({ className, ...props }: DialogOverlayProps): JSX.Element {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 ease-gentle supports-backdrop-filter:backdrop-blur-xs motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0 data-open:animate-in data-open:duration-300 data-open:fade-in-0 data-closed:animate-out data-closed:duration-200 data-closed:fade-out-0",
        className,
      )}
      data-slot="dialog-overlay"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: DialogContentProps): JSX.Element {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 ease-gentle outline-none motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0 sm:max-w-lg data-open:animate-in data-open:duration-300 data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:duration-200 data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        data-slot="dialog-content"
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            className={buttonVariants({
              className: "absolute top-4 right-4",
              size: "icon-sm",
              variant: "ghost",
            })}
            data-slot="dialog-close"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DialogHeader({ className, ...props }: DialogHeaderProps): JSX.Element {
  return (
    <div
      className={cn("flex shrink-0 flex-col gap-2 text-center sm:text-left", className)}
      data-slot="dialog-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

/**
 * Optional scrollable region for long content. When used, the Header and Footer
 * stay pinned (shrink-0) and only this body scrolls; without it, the whole
 * Content scrolls via its own max-height. This is a codefast enhancement over
 * radix-vega, which has no scroll handling for tall dialogs.
 *
 * @since 0.3.16-canary.0
 */
type DialogBodyProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DialogBody({ className, ...props }: DialogBodyProps): JSX.Element {
  return (
    <div
      className={cn("-mx-6 min-h-0 flex-1 overflow-y-auto px-6", className)}
      data-slot="dialog-body"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DialogFooter({ className, ...props }: DialogFooterProps): JSX.Element {
  return (
    <div
      className={cn("flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;

/**
 * @since 0.3.16-canary.0
 */
function DialogTitle({ className, ...props }: DialogTitleProps): JSX.Element {
  return (
    <DialogPrimitive.Title
      className={cn("cn-font-heading leading-none font-medium", className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;

/**
 * @since 0.3.16-canary.0
 */
function DialogDescription({ className, ...props }: DialogDescriptionProps): JSX.Element {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      data-slot="dialog-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DialogCloseProps extends Omit<ComponentProps<typeof DialogPrimitive.Close>, "ref"> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

/**
 * @since 0.3.16-canary.0
 */
function DialogClose({ className, size, variant, ...props }: DialogCloseProps): JSX.Element {
  return (
    <DialogPrimitive.Close
      className={buttonVariants({ className, size, variant })}
      data-slot="dialog-close"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
export type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
};
