"use client";

import * as React from "react";
import {
  CaretSortIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

type SelectProps = SelectPrimitive.SelectProps;
const Select = SelectPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SelectGroup
 * -------------------------------------------------------------------------- */

type SelectGroupProps = SelectPrimitive.SelectGroupProps;
const SelectGroup = SelectPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: SelectValue
 * -------------------------------------------------------------------------- */

type SelectValueProps = SelectPrimitive.SelectValueProps;
const SelectValue = SelectPrimitive.Value;

/* -----------------------------------------------------------------------------
 * Component: SelectTrigger
 * -------------------------------------------------------------------------- */

type SelectTriggerProps = SelectPrimitive.SelectTriggerProps;
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "border-input placeholder:text-muted-foreground focus:ring-offset-background focus:ring-ring flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <CaretSortIcon className="size-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectScrollUpButton
 * -------------------------------------------------------------------------- */

type SelectScrollUpButtonProps = SelectPrimitive.SelectScrollUpButtonProps;
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  SelectScrollUpButtonProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronUpIcon />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectScrollDownButton
 * -------------------------------------------------------------------------- */

type SelectScrollDownButtonProps = SelectPrimitive.SelectScrollDownButtonProps;
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  SelectScrollDownButtonProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronDownIcon />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectContent
 * -------------------------------------------------------------------------- */

type SelectContentProps = SelectPrimitive.SelectContentProps;
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectLabel
 * -------------------------------------------------------------------------- */

type SelectLabelProps = SelectPrimitive.SelectLabelProps;
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

type SelectItemProps = SelectPrimitive.SelectItemProps;
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm focus:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectSeparator
 * -------------------------------------------------------------------------- */

type SelectSeparatorProps = SelectPrimitive.SelectSeparatorProps;
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("bg-muted -mx-1 my-1 h-px", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  type SelectProps,
  type SelectGroupProps,
  type SelectValueProps,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectLabelProps,
  type SelectItemProps,
  type SelectSeparatorProps,
  type SelectScrollUpButtonProps,
  type SelectScrollDownButtonProps,
};
