"use client";

import type { ComponentProps, JSX } from "react";

import { CheckIcon, ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from "lucide-react";

import type { VariantProps } from "@/lib/utils";

import { buttonVariants } from "@/components/button/button.variants";
import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select";

/* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

type SelectProps = ComponentProps<typeof SelectPrimitive.Root>;

function Select({ ...props }: SelectProps): JSX.Element {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectGroup
 * -------------------------------------------------------------------------- */

type SelectGroupProps = ComponentProps<typeof SelectPrimitive.Group>;

function SelectGroup({ ...props }: SelectGroupProps): JSX.Element {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectValue
 * -------------------------------------------------------------------------- */

type SelectValueProps = ComponentProps<typeof SelectPrimitive.Value>;

function SelectValue({ ...props }: SelectValueProps): JSX.Element {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectTrigger
 * -------------------------------------------------------------------------- */

interface SelectTriggerProps extends ComponentProps<typeof SelectPrimitive.Trigger> {
  size?: VariantProps<typeof buttonVariants>["size"];
}

function SelectTrigger({ children, className, size, ...props }: SelectTriggerProps): JSX.Element {
  return (
    <SelectPrimitive.Trigger
      className={buttonVariants({
        className: [
          "[&_svg:not([class*='text-'])]:text-muted-foreground focus:ring-ring/50 focus:ring-3 focus:border-ring w-fit justify-between px-3 font-normal *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:truncate",
          className,
        ],
        size,
        variant: "outline",
      })}
      data-size={size}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild className="size-4 shrink-0 opacity-50">
        <ChevronsUpDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollUpButton
 * -------------------------------------------------------------------------- */

type SelectScrollUpButtonProps = ComponentProps<typeof SelectPrimitive.ScrollUpButton>;

function SelectScrollUpButton({ className, ...props }: SelectScrollUpButtonProps): JSX.Element {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn("text-muted-foreground flex items-center justify-center py-1", className)}
      data-slot="select-scroll-up-button"
      {...props}
    >
      <ChevronUpIcon size={16} />
    </SelectPrimitive.ScrollUpButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollDownButton
 * -------------------------------------------------------------------------- */

type SelectScrollDownButtonProps = ComponentProps<typeof SelectPrimitive.ScrollDownButton>;

function SelectScrollDownButton({ className, ...props }: SelectScrollDownButtonProps): JSX.Element {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn("text-muted-foreground flex items-center justify-center py-1", className)}
      data-slot="select-scroll-down-button"
      {...props}
    >
      <ChevronDownIcon size={16} />
    </SelectPrimitive.ScrollDownButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectContent
 * -------------------------------------------------------------------------- */

type SelectContentProps = ComponentProps<typeof SelectPrimitive.Content>;

function SelectContent({
  children,
  className,
  position = "popper",
  ...props
}: SelectContentProps): JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 relative z-50 max-h-96 min-w-32 overflow-hidden rounded-lg border shadow-lg",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        data-slot="select-content"
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-(--radix-select-trigger-height) min-w-(--radix-select-trigger-width) w-full",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectLabel
 * -------------------------------------------------------------------------- */

type SelectLabelProps = ComponentProps<typeof SelectPrimitive.Label>;

function SelectLabel({ className, ...props }: SelectLabelProps): JSX.Element {
  return (
    <SelectPrimitive.Label
      className={cn("flex items-center gap-x-2 px-2 py-1.5 text-sm font-semibold", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item>;

function SelectItem({ children, className, ...props }: SelectItemProps): JSX.Element {
  return (
    <SelectPrimitive.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground outline-hidden *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive/80 [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        className,
      )}
      data-slot="select-item"
      {...props}
    >
      <span className="absolute right-2 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectSeparator
 * -------------------------------------------------------------------------- */

type SelectSeparatorProps = ComponentProps<typeof SelectPrimitive.Separator>;

function SelectSeparator({ className, ...props }: SelectSeparatorProps): JSX.Element {
  return (
    <SelectPrimitive.Separator
      className={cn("bg-border mx-2 my-1 h-px", className)}
      data-slot="select-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

export type {
  SelectContentProps,
  SelectGroupProps,
  SelectItemProps,
  SelectLabelProps,
  SelectProps,
  SelectScrollDownButtonProps,
  SelectScrollUpButtonProps,
  SelectSeparatorProps,
  SelectTriggerProps,
  SelectValueProps,
};
