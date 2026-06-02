import type { ButtonVariants } from "#/variants/button";
import { buttonVariants } from "#/variants/button";
import type { SheetContentVariants } from "#/variants/sheet";
import { sheetContentVariants } from "#/variants/sheet";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: Sheet
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetProps = ComponentProps<typeof SheetPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Sheet({ children, ...props }: SheetProps): JSX.Element {
  return (
    <SheetPrimitive.Root data-slot="sheet" {...props}>
      {children}
    </SheetPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetTriggerProps = ComponentProps<typeof SheetPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function SheetTrigger({ ...props }: SheetTriggerProps): JSX.Element {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetPortal
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetPortalProps = ComponentProps<typeof SheetPrimitive.Portal>;

/**
 * @since 0.3.16-canary.0
 */
function SheetPortal({ ...props }: SheetPortalProps): JSX.Element {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetOverlay
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetOverlayProps = ComponentProps<typeof SheetPrimitive.Overlay>;

/**
 * @since 0.3.16-canary.0
 */
function SheetOverlay({ className, ...props }: SheetOverlayProps): JSX.Element {
  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/10 ease-gentle supports-backdrop-filter:backdrop-blur-xs motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0 data-open:animate-in data-open:animation-duration-380 data-open:fade-in-0 data-closed:animate-out data-closed:animation-duration-280 data-closed:fade-out-0",
        className,
      )}
      data-slot="sheet-overlay"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SheetContentProps
  extends ComponentProps<typeof SheetPrimitive.Content>, SheetContentVariants {
  showCloseButton?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function SheetContent({
  children,
  className,
  showCloseButton = true,
  side = "right",
  ...props
}: SheetContentProps): JSX.Element {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        className={sheetContentVariants({ className, side })}
        data-side={side}
        data-slot="sheet-content"
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            className={buttonVariants({
              className: "absolute top-4 right-4",
              size: "icon-sm",
              variant: "ghost",
            })}
            data-slot="sheet-close"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SheetHeader({ className, ...props }: SheetHeaderProps): JSX.Element {
  return (
    <div
      className={cn("flex shrink-0 flex-col gap-1.5 p-4", className)}
      data-slot="sheet-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetBody
 * -------------------------------------------------------------------------- */

/**
 * Optional scrollable region for long content. When used, the Header and Footer
 * stay pinned (shrink-0) and only this body scrolls. A codefast enhancement over
 * radix-vega.
 *
 * @since 0.3.16-canary.0
 */
type SheetBodyProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SheetBody({ className, ...props }: SheetBodyProps): JSX.Element {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto px-4", className)}
      data-slot="sheet-body"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SheetFooter({ className, ...props }: SheetFooterProps): JSX.Element {
  return (
    <div
      className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4", className)}
      data-slot="sheet-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetTitleProps = ComponentProps<typeof SheetPrimitive.Title>;

/**
 * @since 0.3.16-canary.0
 */
function SheetTitle({ className, ...props }: SheetTitleProps): JSX.Element {
  return (
    <SheetPrimitive.Title
      className={cn("cn-font-heading font-medium text-foreground", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetDescriptionProps = ComponentProps<typeof SheetPrimitive.Description>;

/**
 * @since 0.3.16-canary.0
 */
function SheetDescription({ className, ...props }: SheetDescriptionProps): JSX.Element {
  return (
    <SheetPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SheetCloseProps extends ComponentProps<typeof SheetPrimitive.Close> {
  size?: ButtonVariants["size"];
  variant?: ButtonVariants["variant"];
}

/**
 * @since 0.3.16-canary.0
 */
function SheetClose({ className, size, variant, ...props }: SheetCloseProps): JSX.Element {
  return (
    <SheetPrimitive.Close
      className={buttonVariants({ className, size, variant })}
      data-slot="sheet-close"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
export type {
  SheetBodyProps,
  SheetCloseProps,
  SheetContentProps,
  SheetDescriptionProps,
  SheetFooterProps,
  SheetHeaderProps,
  SheetOverlayProps,
  SheetPortalProps,
  SheetProps,
  SheetTitleProps,
  SheetTriggerProps,
};
