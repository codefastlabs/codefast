'use client';

import type { ComponentProps, JSX } from 'react';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/dialog';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Command
 * -------------------------------------------------------------------------- */

function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>): JSX.Element {
  return (
    <CommandPrimitive
      className={cn(
        'bg-popover text-popover-foreground outline-hidden flex flex-col overflow-hidden rounded-[inherit]',
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

function CommandDialog({ children, ...props }: ComponentProps<typeof Dialog>): JSX.Element {
  return (
    <Dialog data-slot="command-dialog" {...props}>
      <DialogContent className="rounded-t-lg sm:rounded-lg" data-slot="command-dialog-content">
        <VisuallyHidden>
          <DialogTitle>Search command</DialogTitle>
          <DialogDescription>Use the search bar to find and select the desired command.</DialogDescription>
        </VisuallyHidden>
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

function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>): JSX.Element {
  return (
    <div className="flex items-center gap-2 border-b px-3" cmdk-input-wrapper="" data-slot="command-input-wrapper">
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        className={cn(
          'placeholder:text-muted-foreground outline-hidden flex h-10 w-full text-base disabled:opacity-50 md:text-sm',
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

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>): JSX.Element {
  return (
    <CommandPrimitive.List
      className={cn('max-h-75 overflow-y-auto overflow-x-hidden', className)}
      data-slot="command-list"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandEmpty
 * -------------------------------------------------------------------------- */

function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>): JSX.Element {
  return (
    <CommandPrimitive.Empty
      className={cn('py-6 text-center text-sm', className)}
      data-slot="command-empty"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandGroup
 * -------------------------------------------------------------------------- */

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>): JSX.Element {
  return (
    <CommandPrimitive.Group
      className={cn(
        'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
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

function CommandSeparator({ className, ...props }: ComponentProps<typeof CommandPrimitive.Separator>): JSX.Element {
  return (
    <CommandPrimitive.Separator
      className={cn('bg-border -mx-1 h-px', className)}
      data-slot="command-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandItem
 * -------------------------------------------------------------------------- */

function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>): JSX.Element {
  return (
    <CommandPrimitive.Item
      className={cn(
        "aria-selected:bg-accent aria-selected:text-accent-foreground outline-hidden group/command-item [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default select-none items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
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

function CommandLoading({ className, ...props }: ComponentProps<typeof CommandPrimitive.Loading>): JSX.Element {
  return (
    <CommandPrimitive.Loading
      className={cn('flex justify-center p-2', className)}
      data-slot="command-loading"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CommandShortcut
 * -------------------------------------------------------------------------- */

function CommandShortcut({ className, ...props }: ComponentProps<'span'>): JSX.Element {
  return (
    <span
      className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
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
