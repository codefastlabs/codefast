"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#components/dialog";

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

type CommandProps = ComponentProps<typeof CommandPrimitive>;

function Command({ className, ...props }: CommandProps): JSX.Element {
  return (
    <CommandPrimitive
      className={cn(
        "flex flex-col overflow-hidden",
        "rounded-[inherit] bg-popover",
        "text-popover-foreground",
        "outline-hidden",
        className,
      )}
      data-slot="command"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandDialog
 * -------------------------------------------------------------------------- */

type CommandDialogProps = ComponentProps<typeof Dialog>;

function CommandDialog({ children, ...props }: CommandDialogProps): JSX.Element {
  return (
    <Dialog data-slot="command-dialog" {...props}>
      <DialogContent
        className={cn("rounded-t-lg", "sm:rounded-lg")}
        data-slot="command-dialog-content"
      >
        <VisuallyHidden>
          <DialogTitle>Search command</DialogTitle>
          <DialogDescription>
            Use the search bar to find and select the desired command.
          </DialogDescription>
        </VisuallyHidden>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input]]:h-12">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandInput
 * -------------------------------------------------------------------------- */

type CommandInputProps = ComponentProps<typeof CommandPrimitive.Input>;

function CommandInput({ className, ...props }: CommandInputProps): JSX.Element {
  return (
    <div
      cmdk-input-wrapper
      className={cn("flex items-center gap-2", "px-3", "border-b")}
      data-slot="command-input-wrapper"
    >
      <SearchIcon className={cn("size-4 shrink-0", "opacity-50")} />
      <CommandPrimitive.Input
        className={cn(
          "flex h-10 w-full",
          "text-base",
          "outline-hidden",
          "placeholder:text-muted-foreground",
          "disabled:opacity-50",
          "md:text-sm",
          className,
        )}
        data-slot="command-input"
        {...props}
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandList
 * -------------------------------------------------------------------------- */

type CommandListProps = ComponentProps<typeof CommandPrimitive.List>;

function CommandList({ className, ...props }: CommandListProps): JSX.Element {
  return (
    <CommandPrimitive.List
      className={cn("max-h-75 overflow-x-hidden overflow-y-auto", className)}
      data-slot="command-list"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandEmpty
 * -------------------------------------------------------------------------- */

type CommandEmptyProps = ComponentProps<typeof CommandPrimitive.Empty>;

function CommandEmpty({ className, ...props }: CommandEmptyProps): JSX.Element {
  return (
    <CommandPrimitive.Empty
      className={cn("py-6", "text-center text-sm", className)}
      data-slot="command-empty"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandGroup
 * -------------------------------------------------------------------------- */

type CommandGroupProps = ComponentProps<typeof CommandPrimitive.Group>;

function CommandGroup({ className, ...props }: CommandGroupProps): JSX.Element {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden",
        "p-1",
        "text-foreground",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      data-slot="command-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandSeparator
 * -------------------------------------------------------------------------- */

type CommandSeparatorProps = ComponentProps<typeof CommandPrimitive.Separator>;

function CommandSeparator({ className, ...props }: CommandSeparatorProps): JSX.Element {
  return (
    <CommandPrimitive.Separator
      className={cn("h-px", "-mx-1", "bg-border", className)}
      data-slot="command-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

type CommandItemProps = ComponentProps<typeof CommandPrimitive.Item>;

function CommandItem({ className, ...props }: CommandItemProps): JSX.Element {
  return (
    <CommandPrimitive.Item
      className={cn(
        "group/command-item relative flex items-center gap-x-2",
        "px-2 py-1.5",
        "rounded-sm",
        "text-sm",
        "cursor-default outline-hidden select-none",
        "aria-disabled:opacity-50",
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
        "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      data-slot="command-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandLoading
 * -------------------------------------------------------------------------- */

type CommandLoadingProps = ComponentProps<typeof CommandPrimitive.Loading>;

function CommandLoading({ className, ...props }: CommandLoadingProps): JSX.Element {
  return (
    <CommandPrimitive.Loading
      className={cn("flex justify-center", "p-2", className)}
      data-slot="command-loading"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandShortcut
 * -------------------------------------------------------------------------- */

type CommandShortcutProps = ComponentProps<"span">;

function CommandShortcut({ className, ...props }: CommandShortcutProps): JSX.Element {
  return (
    <span
      className={cn("ml-auto", "text-xs tracking-widest text-muted-foreground", className)}
      data-slot="command-shortcut"
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
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
};
export type {
  CommandDialogProps,
  CommandEmptyProps,
  CommandGroupProps,
  CommandInputProps,
  CommandItemProps,
  CommandListProps,
  CommandLoadingProps,
  CommandProps,
  CommandSeparatorProps,
  CommandShortcutProps,
};
