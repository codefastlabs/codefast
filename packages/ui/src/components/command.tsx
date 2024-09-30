'use client';

import * as React from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/dialog';

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

type CommandElement = React.ComponentRef<typeof CommandPrimitive>;
type CommandProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;

const Command = React.forwardRef<CommandElement, CommandProps>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive
    ref={forwardedRef}
    className={cn(
      'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
      className,
    )}
    {...props}
  />
));

Command.displayName = CommandPrimitive.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandDialog
 * -------------------------------------------------------------------------- */

type CommandDialogProps = React.ComponentProps<typeof Dialog>;

function CommandDialog({ children, ...props }: CommandDialogProps): React.JSX.Element {
  return (
    <Dialog {...props}>
      <DialogContent className="p-0">
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

type CommandInputElement = React.ComponentRef<typeof CommandPrimitive.Input>;
type CommandInputProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;

const CommandInput = React.forwardRef<CommandInputElement, CommandInputProps>(
  ({ className, ...props }, forwardedRef) => (
    <div className="flex items-center gap-2 border-b px-3" cmdk-input-wrapper="">
      <MagnifyingGlassIcon className="size-5 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={forwardedRef}
        className={cn(
          'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent text-sm outline-none disabled:cursor-default disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  ),
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandList
 * -------------------------------------------------------------------------- */

type CommandListElement = React.ComponentRef<typeof CommandPrimitive.List>;
type CommandListProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

const CommandList = React.forwardRef<CommandListElement, CommandListProps>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.List
    ref={forwardedRef}
    className={cn('max-h-72 overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandEmpty
 * -------------------------------------------------------------------------- */

type CommandEmptyElement = React.ComponentRef<typeof CommandPrimitive.Empty>;
type CommandEmptyProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>;

const CommandEmpty = React.forwardRef<CommandEmptyElement, CommandEmptyProps>((props, forwardedRef) => (
  <CommandPrimitive.Empty ref={forwardedRef} className="py-6 text-center text-sm" {...props} />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandGroup
 * -------------------------------------------------------------------------- */

type CommandGroupElement = React.ComponentRef<typeof CommandPrimitive.Group>;
type CommandGroupProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

const CommandGroup = React.forwardRef<CommandGroupElement, CommandGroupProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Group
      ref={forwardedRef}
      className={cn(
        'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  ),
);

CommandGroup.displayName = CommandPrimitive.Group.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandSeparator
 * -------------------------------------------------------------------------- */

type CommandSeparatorElement = React.ComponentRef<typeof CommandPrimitive.Separator>;
type CommandSeparatorProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>;

const CommandSeparator = React.forwardRef<CommandSeparatorElement, CommandSeparatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Separator ref={forwardedRef} className={cn('bg-border -mx-1 h-px', className)} {...props} />
  ),
);

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

type CommandItemElement = React.ComponentRef<typeof CommandPrimitive.Item>;
type CommandItemProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

const CommandItem = React.forwardRef<CommandItemElement, CommandItemProps>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.Item
    ref={forwardedRef}
    className={cn(
      'px-2.75 gap-2.75 h-8',
      'relative flex cursor-pointer select-none items-center rounded-sm text-sm',
      'aria-disabled:pointer-events-none aria-disabled:opacity-50',
      'aria-selected:bg-accent aria-selected:text-accent-foreground aria-selected:outline-none',
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandLoading
 * -------------------------------------------------------------------------- */

type CommandLoadingElement = React.ComponentRef<typeof CommandPrimitive.Loading>;
type CommandLoadingProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>;

const CommandLoading = React.forwardRef<CommandLoadingElement, CommandLoadingProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Loading ref={forwardedRef} className={cn('flex justify-center p-2', className)} {...props} />
  ),
);

CommandLoading.displayName = CommandPrimitive.Loading.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandShortcut
 * -------------------------------------------------------------------------- */

type CommandShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

function CommandShortcut({ className, ...props }: CommandShortcutProps): React.JSX.Element {
  return <span className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)} {...props} />;
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
