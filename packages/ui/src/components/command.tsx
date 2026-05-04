"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/dialog";

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CommandProps = ComponentProps<typeof CommandPrimitive>;

/**
 * @since 0.3.16-canary.0
 */
function Command({ className, ...props }: CommandProps): JSX.Element {
  return (
    <CommandPrimitive
      className={cn(
        "flex flex-col overflow-hidden",
        "rounded-[inherit]",
        "bg-popover text-popover-foreground outline-hidden",
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

/**
 * @since 0.3.16-canary.0
 */
type CommandDialogProps = ComponentProps<typeof Dialog>;

/**
 * @since 0.3.16-canary.0
 */
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
        <Command
          className={cn(
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
            "[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0",
            "[&_[cmdk-input]]:h-12",
          )}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandInput
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CommandInputProps = ComponentProps<typeof CommandPrimitive.Input>;

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
type CommandListProps = ComponentProps<typeof CommandPrimitive.List>;

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
type CommandEmptyProps = ComponentProps<typeof CommandPrimitive.Empty>;

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
type CommandGroupProps = ComponentProps<typeof CommandPrimitive.Group>;

/**
 * @since 0.3.16-canary.0
 */
function CommandGroup({ className, ...props }: CommandGroupProps): JSX.Element {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-foreground",
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

/**
 * @since 0.3.16-canary.0
 */
type CommandSeparatorProps = ComponentProps<typeof CommandPrimitive.Separator>;

/**
 * @since 0.3.16-canary.0
 */
function CommandSeparator({ className, ...props }: CommandSeparatorProps): JSX.Element {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 h-px", "bg-border", className)}
      data-slot="command-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CommandItemProps = ComponentProps<typeof CommandPrimitive.Item>;

/**
 * @since 0.3.16-canary.0
 */
function CommandItem({ className, ...props }: CommandItemProps): JSX.Element {
  return (
    <CommandPrimitive.Item
      className={cn(
        "group/command-item relative flex items-center gap-x-2",
        "px-2 py-1.5",
        "rounded-sm outline-hidden",
        "text-sm",
        "cursor-default select-none",
        "aria-disabled:opacity-50",
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
        "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
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

/**
 * @since 0.3.16-canary.0
 */
type CommandLoadingProps = ComponentProps<typeof CommandPrimitive.Loading>;

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
type CommandShortcutProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
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
