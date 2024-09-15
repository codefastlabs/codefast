'use client';

import * as React from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog, DialogContent } from '@/components/dialog';
import { commandVariants } from '@/styles/command-variants';

/* -----------------------------------------------------------------------------
 * Variant: Command
 * -------------------------------------------------------------------------- */

const { root, dialog, inputWrapper, inputIcon, input, list, empty, group, separator, item, loading, shortcut } =
  commandVariants();

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

type CommandElement = React.ElementRef<typeof CommandPrimitive>;
type CommandProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;

const Command = React.forwardRef<CommandElement, CommandProps>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive ref={forwardedRef} className={root({ className })} {...props} />
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
        <Command className={dialog()}>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandInput
 * -------------------------------------------------------------------------- */

type CommandInputElement = React.ElementRef<typeof CommandPrimitive.Input>;
type CommandInputProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;

const CommandInput = React.forwardRef<CommandInputElement, CommandInputProps>(
  ({ className, ...props }, forwardedRef) => (
    <div className={inputWrapper()} cmdk-input-wrapper="">
      <MagnifyingGlassIcon className={inputIcon()} />
      <CommandPrimitive.Input ref={forwardedRef} className={input({ className })} {...props} />
    </div>
  ),
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandList
 * -------------------------------------------------------------------------- */

type CommandListElement = React.ElementRef<typeof CommandPrimitive.List>;
type CommandListProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

const CommandList = React.forwardRef<CommandListElement, CommandListProps>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.List ref={forwardedRef} className={list({ className })} {...props} />
));

CommandList.displayName = CommandPrimitive.List.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandEmpty
 * -------------------------------------------------------------------------- */

type CommandEmptyElement = React.ElementRef<typeof CommandPrimitive.Empty>;
type CommandEmptyProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>;

const CommandEmpty = React.forwardRef<CommandEmptyElement, CommandEmptyProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Empty ref={forwardedRef} className={empty({ className })} {...props} />
  ),
);

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandGroup
 * -------------------------------------------------------------------------- */

type CommandGroupElement = React.ElementRef<typeof CommandPrimitive.Group>;
type CommandGroupProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

const CommandGroup = React.forwardRef<CommandGroupElement, CommandGroupProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Group ref={forwardedRef} className={group({ className })} {...props} />
  ),
);

CommandGroup.displayName = CommandPrimitive.Group.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandSeparator
 * -------------------------------------------------------------------------- */

type CommandSeparatorElement = React.ElementRef<typeof CommandPrimitive.Separator>;
type CommandSeparatorProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>;

const CommandSeparator = React.forwardRef<CommandSeparatorElement, CommandSeparatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Separator ref={forwardedRef} className={separator({ className })} {...props} />
  ),
);

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

type CommandItemElement = React.ElementRef<typeof CommandPrimitive.Item>;
type CommandItemProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

const CommandItem = React.forwardRef<CommandItemElement, CommandItemProps>(({ className, ...props }, forwardedRef) => (
  <CommandPrimitive.Item ref={forwardedRef} className={item({ className })} {...props} />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandLoading
 * -------------------------------------------------------------------------- */

type CommandLoadingElement = React.ElementRef<typeof CommandPrimitive.Loading>;
type CommandLoadingProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>;

const CommandLoading = React.forwardRef<CommandLoadingElement, CommandLoadingProps>(
  ({ className, ...props }, forwardedRef) => (
    <CommandPrimitive.Loading ref={forwardedRef} className={loading({ className })} {...props} />
  ),
);

CommandLoading.displayName = CommandPrimitive.Loading.displayName;

/* -----------------------------------------------------------------------------
 * Component: CommandShortcut
 * -------------------------------------------------------------------------- */

type CommandShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

function CommandShortcut({ className, ...props }: CommandShortcutProps): React.JSX.Element {
  return <span className={shortcut({ className })} {...props} />;
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
