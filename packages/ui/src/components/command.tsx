'use client';

import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Command as CommandPrimitive } from 'cmdk';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
} from 'react';

import { Dialog, DialogContent } from '@/components/dialog';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

type CommandElement = ComponentRef<typeof CommandPrimitive>;
type CommandProps = ComponentPropsWithoutRef<typeof CommandPrimitive>;

const Command = forwardRef<CommandElement, CommandProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive
      ref={forwardedRef}
      className={cn(
        'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
        className,
      )}
      {...props}
    />
  ),
);

Command.displayName = CommandPrimitive.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandDialog
 * -------------------------------------------------------------------------- */

type CommandDialogProps = ComponentProps<typeof Dialog>;

function CommandDialog({
  children,
  ...props
}: CommandDialogProps): JSX.Element {
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

type CommandInputElement = ComponentRef<typeof CommandPrimitive.Input>;
type CommandInputProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Input
>;

const CommandInput = forwardRef<CommandInputElement, CommandInputProps>(
  ({ className, ...props }, forwardedRef) => (
    <div
      className="flex items-center gap-2 border-b px-3"
      cmdk-input-wrapper=""
    >
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

type CommandListElement = ComponentRef<typeof CommandPrimitive.List>;
type CommandListProps = ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

const CommandList = forwardRef<CommandListElement, CommandListProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.List
      ref={forwardedRef}
      className={cn('max-h-72 overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  ),
);

CommandList.displayName = CommandPrimitive.List.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandEmpty
 * -------------------------------------------------------------------------- */

type CommandEmptyElement = ComponentRef<typeof CommandPrimitive.Empty>;
type CommandEmptyProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Empty
>;

const CommandEmpty = forwardRef<CommandEmptyElement, CommandEmptyProps>(
  (props, forwardedRef) => (
    <CommandPrimitive.Empty
      ref={forwardedRef}
      className="py-6 text-center text-sm"
      {...props}
    />
  ),
);

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandGroup
 * -------------------------------------------------------------------------- */

type CommandGroupElement = ComponentRef<typeof CommandPrimitive.Group>;
type CommandGroupProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Group
>;

const CommandGroup = forwardRef<CommandGroupElement, CommandGroupProps>(
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

type CommandSeparatorElement = ComponentRef<typeof CommandPrimitive.Separator>;
type CommandSeparatorProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Separator
>;

const CommandSeparator = forwardRef<
  CommandSeparatorElement,
  CommandSeparatorProps
>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.Separator
    ref={forwardedRef}
    className={cn('bg-border -mx-1 h-px', className)}
    {...props}
  />
));

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

type CommandItemElement = ComponentRef<typeof CommandPrimitive.Item>;
type CommandItemProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

const CommandItem = forwardRef<CommandItemElement, CommandItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'relative flex cursor-pointer select-none items-center rounded-sm text-sm',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        'aria-selected:bg-accent aria-selected:text-accent-foreground aria-selected:outline-none',
        className,
      )}
      {...props}
    />
  ),
);

CommandItem.displayName = CommandPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandLoading
 * -------------------------------------------------------------------------- */

type CommandLoadingElement = ComponentRef<typeof CommandPrimitive.Loading>;
type CommandLoadingProps = ComponentPropsWithoutRef<
  typeof CommandPrimitive.Loading
>;

const CommandLoading = forwardRef<CommandLoadingElement, CommandLoadingProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Loading
      ref={forwardedRef}
      className={cn('flex justify-center p-2', className)}
      {...props}
    />
  ),
);

CommandLoading.displayName = CommandPrimitive.Loading.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandShortcut
 * -------------------------------------------------------------------------- */

type CommandShortcutProps = HTMLAttributes<HTMLSpanElement>;

function CommandShortcut({
  className,
  ...props
}: CommandShortcutProps): JSX.Element {
  return (
    <span
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
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
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
  type CommandDialogProps,
  type CommandEmptyProps,
  type CommandGroupProps,
  type CommandInputProps,
  type CommandItemProps,
  type CommandListProps,
  type CommandLoadingProps,
  type CommandProps,
  type CommandSeparatorProps,
  type CommandShortcutProps,
};
