import { XIcon } from "lucide-react";
import * as SheetPrimitive from "radix-ui/dialog";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import type { ButtonVariants } from "#/variants/button";
import { buttonVariants } from "#/variants/button";
import type { SheetContentVariants } from "#/variants/sheet";
import { sheetContentVariants } from "#/variants/sheet";

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
function Sheet({ ...props }: SheetProps): JSX.Element {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
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
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SheetContentProps extends ComponentProps<typeof SheetPrimitive.Content>, SheetContentVariants {
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
    <SheetPrimitive.Portal data-slot="sheet-portal">
      <SheetPrimitive.Overlay
        className={
          "fixed inset-0 z-50 bg-black/10 ease-gentle supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:animation-duration-panel-in data-open:fade-in-0 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-panel-out data-closed:fade-out-0"
        }
        data-slot="sheet-overlay"
      />
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
              className: "absolute top-3 inset-e-3",
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
    </SheetPrimitive.Portal>
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
  return <div className={cn("flex shrink-0 flex-col gap-0.5 p-4", className)} data-slot="sheet-header" {...props} />;
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
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-4", className)} data-slot="sheet-body" {...props} />;
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
    <div className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4", className)} data-slot="sheet-footer" {...props} />
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
      className={cn("font-heading text-base font-medium text-foreground", className)}
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
    <SheetPrimitive.Close className={buttonVariants({ className, size, variant })} data-slot="sheet-close" {...props} />
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
  SheetProps,
  SheetTitleProps,
  SheetTriggerProps,
};
