"use client";

import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { CheckIcon, ChevronRightIcon, DotFilledIcon } from "@radix-ui/react-icons";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: ContextMenu
 * -------------------------------------------------------------------------- */

type ContextMenuProps = React.ComponentProps<typeof ContextMenuPrimitive.Root>;
const ContextMenu = ContextMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuTriggerProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger>;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuGroup
 * -------------------------------------------------------------------------- */

type ContextMenuGroupProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Group>;
const ContextMenuGroup = ContextMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSub
 * -------------------------------------------------------------------------- */

type ContextMenuSubProps = React.ComponentProps<typeof ContextMenuPrimitive.Sub>;
const ContextMenuSub = ContextMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioGroup
 * -------------------------------------------------------------------------- */

type ContextMenuRadioGroupProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioGroup>;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuSubTriggerElement = React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>;

interface ContextMenuSubTriggerProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

const ContextMenuSubTrigger = React.forwardRef<ContextMenuSubTriggerElement, ContextMenuSubTriggerProps>(
  ({ children, className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm focus:outline",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </ContextMenuPrimitive.SubTrigger>
  ),
);

ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubContent
 * -------------------------------------------------------------------------- */

type ContextMenuSubContentElement = React.ElementRef<typeof ContextMenuPrimitive.SubContent>;
type ContextMenuSubContentProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>;

const ContextMenuSubContent = React.forwardRef<ContextMenuSubContentElement, ContextMenuSubContentProps>(
  ({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        ref={ref}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 min-w-32 rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  ),
);

ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuContent
 * -------------------------------------------------------------------------- */

type ContextMenuContentElement = React.ElementRef<typeof ContextMenuPrimitive.Content>;
type ContextMenuContentProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>;

const ContextMenuContent = React.forwardRef<ContextMenuContentElement, ContextMenuContentProps>(
  ({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={ref}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 z-50 min-w-32 rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  ),
);

ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuItem
 * -------------------------------------------------------------------------- */

type ContextMenuItemElement = React.ElementRef<typeof ContextMenuPrimitive.Item>;

interface ContextMenuItemProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> {
  inset?: boolean;
}

const ContextMenuItem = React.forwardRef<ContextMenuItemElement, ContextMenuItemProps>(
  ({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm focus:outline aria-disabled:pointer-events-none aria-disabled:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  ),
);

ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type ContextMenuCheckboxItemElement = React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>;
type ContextMenuCheckboxItemProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>;

const ContextMenuCheckboxItem = React.forwardRef<ContextMenuCheckboxItemElement, ContextMenuCheckboxItemProps>(
  ({ children, className, checked, ...props }, ref) => (
    <ContextMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm focus:outline aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  ),
);

ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioItem
 * -------------------------------------------------------------------------- */

type ContextMenuRadioItemElement = React.ElementRef<typeof ContextMenuPrimitive.RadioItem>;
type ContextMenuRadioItemProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>;

const ContextMenuRadioItem = React.forwardRef<ContextMenuRadioItemElement, ContextMenuRadioItemProps>(
  ({ children, className, ...props }, ref) => (
    <ContextMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm focus:outline aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <DotFilledIcon className="size-4 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  ),
);

ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuLabel
 * -------------------------------------------------------------------------- */

type ContextMenuLabelElement = React.ElementRef<typeof ContextMenuPrimitive.Label>;

interface ContextMenuLabelProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> {
  inset?: boolean;
}

const ContextMenuLabel = React.forwardRef<ContextMenuLabelElement, ContextMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Label
      ref={ref}
      className={cn("text-foreground px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...props}
    />
  ),
);

ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSeparator
 * -------------------------------------------------------------------------- */

type ContextMenuSeparatorElement = React.ElementRef<typeof ContextMenuPrimitive.Separator>;
type ContextMenuSeparatorProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>;

const ContextMenuSeparator = React.forwardRef<ContextMenuSeparatorElement, ContextMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Separator ref={ref} className={cn("bg-border -mx-1 my-1 h-px", className)} {...props} />
  ),
);

ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuShortcut
 * -------------------------------------------------------------------------- */

type ContextMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

function ContextMenuShortcut({ className, ...props }: ContextMenuShortcutProps): React.JSX.Element {
  return <span className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuArrow
 * -------------------------------------------------------------------------- */

type ContextMenuArrowElement = React.ElementRef<typeof ContextMenuPrimitive.Arrow>;
type ContextMenuArrowProps = ContextMenuPrimitive.ContextMenuArrowProps;

const ContextMenuArrow = React.forwardRef<ContextMenuArrowElement, ContextMenuArrowProps>(
  ({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Arrow ref={ref} className={cn("fill-popover", className)} {...props} />
  ),
);

ContextMenuArrow.displayName = ContextMenuPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
  ContextMenuArrow,
  type ContextMenuProps,
  type ContextMenuTriggerProps,
  type ContextMenuContentProps,
  type ContextMenuItemProps,
  type ContextMenuCheckboxItemProps,
  type ContextMenuRadioItemProps,
  type ContextMenuLabelProps,
  type ContextMenuSeparatorProps,
  type ContextMenuShortcutProps,
  type ContextMenuGroupProps,
  type ContextMenuSubProps,
  type ContextMenuSubContentProps,
  type ContextMenuSubTriggerProps,
  type ContextMenuRadioGroupProps,
  type ContextMenuArrowProps,
};
