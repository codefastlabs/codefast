'use client';

import type { ComponentProps, JSX } from 'react';

import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/dialog';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

type CommandProps = ComponentProps<typeof CommandPrimitive>;

function Command({ className, ...props }: CommandProps): JSX.Element {
  return (
    <CommandPrimitive
      className={cn(
        'bg-popover text-popover-foreground flex flex-col overflow-hidden rounded-[inherit] focus-visible:outline-none',
        className,
      )}
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
    <Dialog {...props}>
      <DialogContent className="p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input]]:h-12">
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
    <div className="flex items-center gap-2 border-b px-3" cmdk-input-wrapper="">
      <SearchIcon className="size-5 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        className={cn(
          'placeholder:text-muted-foreground flex h-10 w-full text-sm outline-none disabled:opacity-50',
          className,
        )}
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
  return <CommandPrimitive.List className={cn('max-h-75 overflow-y-auto overflow-x-hidden', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CommandEmpty
 * -------------------------------------------------------------------------- */

type CommandEmptyProps = ComponentProps<typeof CommandPrimitive.Empty>;

function CommandEmpty({ className, ...props }: CommandEmptyProps): JSX.Element {
  return <CommandPrimitive.Empty className={cn('py-6 text-center text-sm', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CommandGroup
 * -------------------------------------------------------------------------- */

type CommandGroupProps = ComponentProps<typeof CommandPrimitive.Group>;

function CommandGroup({ className, ...props }: CommandGroupProps): JSX.Element {
  return (
    <CommandPrimitive.Group
      className={cn(
        'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandSeparator
 * -------------------------------------------------------------------------- */

type CommandSeparatorProps = ComponentProps<typeof CommandPrimitive.Separator>;

function CommandSeparator({ className, ...props }: CommandSeparatorProps): JSX.Element {
  return <CommandPrimitive.Separator className={cn('bg-border -mx-1 h-px', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

type CommandItemProps = ComponentProps<typeof CommandPrimitive.Item>;

function CommandItem({ className, ...props }: CommandItemProps): JSX.Element {
  return (
    <CommandPrimitive.Item
      className={cn(
        'aria-selected:bg-accent aria-selected:text-accent-foreground group relative flex select-none items-center gap-x-2 rounded-sm px-3 py-1.5 text-sm aria-disabled:opacity-50 aria-selected:outline-none',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandLoading
 * -------------------------------------------------------------------------- */

type CommandLoadingProps = ComponentProps<typeof CommandPrimitive.Loading>;

function CommandLoading({ className, ...props }: CommandLoadingProps): JSX.Element {
  return <CommandPrimitive.Loading className={cn('flex justify-center p-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CommandShortcut
 * -------------------------------------------------------------------------- */

type CommandShortcutProps = ComponentProps<'span'>;

function CommandShortcut({ className, ...props }: CommandShortcutProps): JSX.Element {
  return (
    <span
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest group-aria-selected:text-current',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
