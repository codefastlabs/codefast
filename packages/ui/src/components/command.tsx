import { Command as CommandPrimitive } from "cmdk";
import { CheckIcon, SearchIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "#/components/dialog";
import { InputGroup, InputGroupAddon } from "#/components/input-group";
import { cn } from "#/lib/utils";

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
        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
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
interface CommandDialogProps extends ComponentProps<typeof Dialog> {
  className?: string;
  description?: string;
  showCloseButton?: boolean;
  title?: string;
}

/**
 * @since 0.3.16-canary.0
 */
function CommandDialog({
  children,
  className,
  description = "Search for a command to run...",
  showCloseButton = false,
  title = "Command Palette",
  ...props
}: CommandDialogProps): JSX.Element {
  return (
    <Dialog data-slot="command-dialog" {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("top-1/3 translate-y-0 overflow-hidden rounded-xl p-0", className)}
        data-slot="command-dialog-content"
        showCloseButton={showCloseButton}
      >
        {children}
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
    <div className="p-1 pb-0" data-slot="command-input-wrapper">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:ps-2!">
        <CommandPrimitive.Input
          className={cn("w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50", className)}
          data-slot="command-input"
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
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
      className={cn("max-h-72 scroll-py-1 scrollbar-none overflow-x-hidden overflow-y-auto outline-none", className)}
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
      className={cn("py-6 text-center text-sm", className)}
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
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
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
      className={cn("-mx-1 h-px w-auto bg-border", className)}
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
function CommandItem({ children, className, ...props }: CommandItemProps): JSX.Element {
  return (
    <CommandPrimitive.Item
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-selected:bg-muted data-selected:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:**:[svg]:text-foreground",
        className,
      )}
      data-slot="command-item"
      {...props}
    >
      {children}
      <CheckIcon className="ms-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-checked/command-item:opacity-100" />
    </CommandPrimitive.Item>
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
      className={cn("flex justify-center p-2", className)}
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
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className,
      )}
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
