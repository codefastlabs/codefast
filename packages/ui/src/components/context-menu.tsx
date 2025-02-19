import type { ComponentProps, JSX } from 'react';

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { CheckIcon, ChevronRightIcon, DotIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: ContextMenu
 * -------------------------------------------------------------------------- */

type ContextMenuProps = ComponentProps<typeof ContextMenuPrimitive.Root>;
const ContextMenu = ContextMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuTriggerProps = ComponentProps<typeof ContextMenuPrimitive.Trigger>;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuGroup
 * -------------------------------------------------------------------------- */

type ContextMenuGroupProps = ComponentProps<typeof ContextMenuPrimitive.Group>;
const ContextMenuGroup = ContextMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSub
 * -------------------------------------------------------------------------- */

type ContextMenuSubProps = ComponentProps<typeof ContextMenuPrimitive.Sub>;
const ContextMenuSub = ContextMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioGroup
 * -------------------------------------------------------------------------- */

type ContextMenuRadioGroupProps = ComponentProps<typeof ContextMenuPrimitive.RadioGroup>;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubTrigger
 * -------------------------------------------------------------------------- */

interface ContextMenuSubTriggerProps extends ComponentProps<typeof ContextMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

function ContextMenuSubTrigger({ children, className, inset, ...props }: ContextMenuSubTriggerProps): JSX.Element {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'flex select-none items-center rounded-sm text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubContent
 * -------------------------------------------------------------------------- */

type ContextMenuSubContentProps = ComponentProps<typeof ContextMenuPrimitive.SubContent>;

function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
          'data-[state=open]:data-[side=right]:slide-in-from-left-2',
          'data-[state=open]:data-[side=bottom]:slide-in-from-top-2',
          'data-[state=open]:data-[side=left]:slide-in-from-right-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
          'data-[state=closed]:data-[side=top]:slide-out-to-bottom-2',
          'data-[state=closed]:data-[side=right]:slide-out-to-left-2',
          'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2',
          'data-[state=closed]:data-[side=left]:slide-out-to-right-2',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuContent
 * -------------------------------------------------------------------------- */

type ContextMenuContentProps = ComponentProps<typeof ContextMenuPrimitive.Content>;

function ContextMenuContent({ className, ...props }: ContextMenuContentProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
          'data-[state=open]:data-[side=right]:slide-in-from-left-2',
          'data-[state=open]:data-[side=bottom]:slide-in-from-top-2',
          'data-[state=open]:data-[side=left]:slide-in-from-right-2',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuItem
 * -------------------------------------------------------------------------- */

interface ContextMenuItemProps extends ComponentProps<typeof ContextMenuPrimitive.Item> {
  inset?: boolean;
}

function ContextMenuItem({ className, inset, ...props }: ContextMenuItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'relative flex select-none items-center rounded-sm text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:opacity-50',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type ContextMenuCheckboxItemProps = ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>;

function ContextMenuCheckboxItem({
  checked,
  children,
  className,
  ...props
}: ContextMenuCheckboxItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'pl-8',
        'relative flex select-none items-center rounded-sm text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioItem
 * -------------------------------------------------------------------------- */

type ContextMenuRadioItemProps = ComponentProps<typeof ContextMenuPrimitive.RadioItem>;

function ContextMenuRadioItem({ children, className, ...props }: ContextMenuRadioItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'pl-8',
        'relative flex select-none items-center rounded-sm text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <DotIcon className="size-4 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuLabel
 * -------------------------------------------------------------------------- */

interface ContextMenuLabelProps extends ComponentProps<typeof ContextMenuPrimitive.Label> {
  inset?: boolean;
}

function ContextMenuLabel({ className, inset, ...props }: ContextMenuLabelProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Label
      className={cn('gap-x-2 px-3 py-1.5', 'flex items-center text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSeparator
 * -------------------------------------------------------------------------- */

type ContextMenuSeparatorProps = ComponentProps<typeof ContextMenuPrimitive.Separator>;

function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps): JSX.Element {
  return <ContextMenuPrimitive.Separator className={cn('bg-muted mx-2 my-1 h-px', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuShortcut
 * -------------------------------------------------------------------------- */

type ContextMenuShortcutProps = ComponentProps<'span'>;

function ContextMenuShortcut({ className, ...props }: ContextMenuShortcutProps): JSX.Element {
  return <span className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuArrow
 * -------------------------------------------------------------------------- */

type ContextMenuArrowProps = ContextMenuPrimitive.ContextMenuArrowProps;

function ContextMenuArrow({ className, ...props }: ContextMenuArrowProps): JSX.Element {
  return <ContextMenuPrimitive.Arrow className={cn('fill-popover', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  ContextMenuArrowProps,
  ContextMenuCheckboxItemProps,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuProps,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemProps,
  ContextMenuSeparatorProps,
  ContextMenuShortcutProps,
  ContextMenuSubContentProps,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuTriggerProps,
};
export {
  ContextMenu,
  ContextMenuArrow,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
