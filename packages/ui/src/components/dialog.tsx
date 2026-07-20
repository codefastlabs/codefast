import { XIcon } from "lucide-react";
import * as DialogPrimitive from "radix-ui/dialog";
import type { ComponentProps, JSX } from "react";

import { Button } from "#/components/button";
import { cn } from "#/lib/utils";

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
function DialogContent({ children, className, showCloseButton = true, ...props }: DialogContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal">
      <DialogPrimitive.Overlay
        className={
          "fixed inset-0 isolate z-50 bg-black/10 ease-gentle supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:animation-duration-overlay-in data-open:fade-in-0 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-overlay-out data-closed:fade-out-0"
        }
        data-slot="dialog-overlay"
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-s-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 ease-ui outline-none sm:max-w-sm rtl:translate-x-1/2 data-open:animate-in data-open:animation-duration-overlay-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-overlay-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        data-slot="dialog-content"
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close asChild data-slot="dialog-close">
            <Button className="absolute inset-e-2 top-2" size="icon-sm" variant="ghost">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
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
  return <div className={cn("flex shrink-0 flex-col gap-2", className)} data-slot="dialog-header" {...props} />;
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
    <div className={cn("-mx-4 min-h-0 flex-1 overflow-y-auto px-4", className)} data-slot="dialog-body" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DialogFooterProps extends ComponentProps<"div"> {
  showCloseButton?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function DialogFooter({ children, className, showCloseButton = false, ...props }: DialogFooterProps): JSX.Element {
  return (
    <div
      className={cn(
        "-mx-4 -mb-4 flex shrink-0 flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className,
      )}
      data-slot="dialog-footer"
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      ) : null}
    </div>
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
      className={cn("font-heading text-base leading-none font-medium", className)}
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
type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;

/**
 * @since 0.3.16-canary.0
 */
function DialogClose({ ...props }: DialogCloseProps): JSX.Element {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
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
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
};
