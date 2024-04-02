"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "./utils";
import { Dialog, DialogContent } from "./dialog";

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

type CommandProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  CommandProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandDialog
 * -------------------------------------------------------------------------- */

type CommandDialogProps = DialogProps;
function CommandDialog({
  children,
  ...props
}: CommandDialogProps): React.JSX.Element {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandInput
 * -------------------------------------------------------------------------- */

type CommandInputProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Input
>;
const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b px-3" cmdk-input-wrapper="">
    <MagnifyingGlassIcon className="size-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandList
 * -------------------------------------------------------------------------- */

type CommandListProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.List
>;
const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  CommandListProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandEmpty
 * -------------------------------------------------------------------------- */

type CommandEmptyProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Empty
>;
const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  CommandEmptyProps
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandGroup
 * -------------------------------------------------------------------------- */

type CommandGroupProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Group
>;
const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandSeparator
 * -------------------------------------------------------------------------- */

type CommandSeparatorProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Separator
>;
const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  CommandSeparatorProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("bg-border -mx-1 h-px", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

type CommandItemProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Item
>;
const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "aria-selected:bg-accent aria-selected:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm focus:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandLoading
 * -------------------------------------------------------------------------- */

type CommandLoadingProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Loading
>;
const CommandLoading = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Loading>,
  CommandLoadingProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Loading
    ref={ref}
    className={cn("flex justify-center p-2", className)}
    {...props}
  />
));
CommandLoading.displayName = CommandPrimitive.Loading.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandShortcut
 * -------------------------------------------------------------------------- */

type CommandShortcutProps = React.HTMLAttributes<HTMLSpanElement>;
function CommandShortcut({
  className,
  ...props
}: CommandShortcutProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandLoading,
  CommandShortcut,
  CommandSeparator,
  type CommandProps,
  type CommandDialogProps,
  type CommandInputProps,
  type CommandListProps,
  type CommandEmptyProps,
  type CommandGroupProps,
  type CommandItemProps,
  type CommandLoadingProps,
  type CommandShortcutProps,
  type CommandSeparatorProps,
};
