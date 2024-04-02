"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  CheckIcon,
  ChevronRightIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: DropdownMenu
 * -------------------------------------------------------------------------- */

type DropdownMenuProps = DropdownMenuPrimitive.DropdownMenuProps;
const DropdownMenu = DropdownMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuTriggerProps = DropdownMenuPrimitive.DropdownMenuTriggerProps;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuGroup
 * -------------------------------------------------------------------------- */

type DropdownMenuGroupProps = DropdownMenuPrimitive.DropdownMenuGroupProps;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSub
 * -------------------------------------------------------------------------- */

type DropdownMenuSubProps = DropdownMenuPrimitive.DropdownMenuSubProps;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioGroupProps =
  DropdownMenuPrimitive.DropdownMenuRadioGroupProps;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

interface DropdownMenuSubTriggerProps
  extends DropdownMenuPrimitive.DropdownMenuSubTriggerProps {
  inset?: boolean;
}
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "focus:bg-accent data-[state=open]:bg-accent flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm focus:outline-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto size-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubContent
 * -------------------------------------------------------------------------- */

type DropdownMenuSubContentProps =
  DropdownMenuPrimitive.DropdownMenuSubContentProps;
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 min-w-[8rem] rounded-md border p-1 shadow-md focus:outline-none",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuContent
 * -------------------------------------------------------------------------- */

type DropdownMenuContentProps = DropdownMenuPrimitive.DropdownMenuContentProps;
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 min-w-[8rem] rounded-md border p-1 shadow-md focus:outline-none",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuItem
 * -------------------------------------------------------------------------- */

interface DropdownMenuItemProps
  extends DropdownMenuPrimitive.DropdownMenuItemProps {
  inset?: boolean;
}
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm transition-colors focus:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type DropdownMenuCheckboxItemProps =
  DropdownMenuPrimitive.DropdownMenuCheckboxItemProps;
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors focus:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuRadioItem
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioItemProps =
  DropdownMenuPrimitive.DropdownMenuRadioItemProps;
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors focus:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <DotFilledIcon className="size-4 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuLabel
 * -------------------------------------------------------------------------- */

interface DropdownMenuLabelProps
  extends DropdownMenuPrimitive.DropdownMenuLabelProps {
  inset?: boolean;
}
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSeparator
 * -------------------------------------------------------------------------- */

type DropdownMenuSeparatorProps =
  DropdownMenuPrimitive.DropdownMenuSeparatorProps;
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("bg-muted -mx-1 my-1 h-px", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuShortcut
 * -------------------------------------------------------------------------- */

type DropdownMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>;
function DropdownMenuShortcut({
  className,
  ...props
}: DropdownMenuShortcutProps): React.JSX.Element {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  type DropdownMenuProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuGroupProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuRadioGroupProps,
};
