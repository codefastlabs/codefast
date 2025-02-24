import type { ComponentProps, JSX } from 'react';

import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { CheckIcon, ChevronRightIcon, DotIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: MenubarMenu
 * -------------------------------------------------------------------------- */

type MenubarMenuProps = ComponentProps<typeof MenubarPrimitive.Menu>;
const MenubarMenu = MenubarPrimitive.Menu;

/* -----------------------------------------------------------------------------
 * Component: MenubarGroup
 * -------------------------------------------------------------------------- */

type MenubarGroupProps = ComponentProps<typeof MenubarPrimitive.Group>;
const MenubarGroup = MenubarPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: MenubarSub
 * -------------------------------------------------------------------------- */

type MenubarSubProps = ComponentProps<typeof MenubarPrimitive.Sub>;
const MenubarSub = MenubarPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioGroup
 * -------------------------------------------------------------------------- */

type MenubarRadioGroupProps = ComponentProps<typeof MenubarPrimitive.RadioGroup>;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: Menubar
 * -------------------------------------------------------------------------- */

type MenubarProps = ComponentProps<typeof MenubarPrimitive.Root>;

function Menubar({ className, ...props }: MenubarProps): JSX.Element {
  return (
    <MenubarPrimitive.Root
      className={cn('bg-background flex h-10 items-center space-x-1 rounded-md border p-1', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarTrigger
 * -------------------------------------------------------------------------- */

type MenubarTriggerProps = ComponentProps<typeof MenubarPrimitive.Trigger>;

function MenubarTrigger({ className, ...props }: MenubarTriggerProps): JSX.Element {
  return (
    <MenubarPrimitive.Trigger
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'flex select-none items-center rounded-sm text-sm font-medium',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSubTrigger
 * -------------------------------------------------------------------------- */

interface MenubarSubTriggerProps extends ComponentProps<typeof MenubarPrimitive.SubTrigger> {
  inset?: boolean;
}

function MenubarSubTrigger({ children, className, inset, ...props }: MenubarSubTriggerProps): JSX.Element {
  return (
    <MenubarPrimitive.SubTrigger
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
    </MenubarPrimitive.SubTrigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSubContent
 * -------------------------------------------------------------------------- */

type MenubarSubContentProps = ComponentProps<typeof MenubarPrimitive.SubContent>;

function MenubarSubContent({ className, ...props }: MenubarSubContentProps): JSX.Element {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=top]:slide-from-b-2',
          'data-[state=open]:data-[side=right]:slide-from-l-2',
          'data-[state=open]:data-[side=bottom]:slide-from-t-2',
          'data-[state=open]:data-[side=left]:slide-from-r-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[state=closed]:data-[side=top]:slide-to-b-2',
          'data-[state=closed]:data-[side=right]:slide-to-l-2',
          'data-[state=closed]:data-[side=bottom]:slide-to-t-2',
          'data-[state=closed]:data-[side=left]:slide-to-r-2',
          className,
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarContent
 * -------------------------------------------------------------------------- */

type MenubarContentProps = ComponentProps<typeof MenubarPrimitive.Content>;

function MenubarContent({
  align = 'start',
  alignOffset = -4,
  className,
  sideOffset = 8,
  ...props
}: MenubarContentProps): JSX.Element {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        align={align}
        alignOffset={alignOffset}
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=top]:slide-from-b-2',
          'data-[state=open]:data-[side=right]:slide-from-l-2',
          'data-[state=open]:data-[side=bottom]:slide-from-t-2',
          'data-[state=open]:data-[side=left]:slide-from-r-2',
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarItem
 * -------------------------------------------------------------------------- */

interface MenubarItemProps extends ComponentProps<typeof MenubarPrimitive.Item> {
  inset?: boolean;
}

function MenubarItem({ className, inset, ...props }: MenubarItemProps): JSX.Element {
  return (
    <MenubarPrimitive.Item
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
 * Component: MenubarCheckboxItem
 * -------------------------------------------------------------------------- */

type MenubarCheckboxItemProps = ComponentProps<typeof MenubarPrimitive.CheckboxItem>;

function MenubarCheckboxItem({ checked, children, className, ...props }: MenubarCheckboxItemProps): JSX.Element {
  return (
    <MenubarPrimitive.CheckboxItem
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
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioItem
 * -------------------------------------------------------------------------- */

type MenubarRadioItemProps = ComponentProps<typeof MenubarPrimitive.RadioItem>;

function MenubarRadioItem({ children, className, ...props }: MenubarRadioItemProps): JSX.Element {
  return (
    <MenubarPrimitive.RadioItem
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
        <MenubarPrimitive.ItemIndicator>
          <DotIcon className="size-4 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarLabel
 * -------------------------------------------------------------------------- */

interface MenubarLabelProps extends ComponentProps<typeof MenubarPrimitive.Label> {
  inset?: boolean;
}

function MenubarLabel({ className, inset, ...props }: MenubarLabelProps): JSX.Element {
  return (
    <MenubarPrimitive.Label
      className={cn('gap-x-2 px-3 py-1.5', 'flex items-center text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSeparator
 * -------------------------------------------------------------------------- */

type MenubarSeparatorProps = ComponentProps<typeof MenubarPrimitive.Separator>;

function MenubarSeparator({ className, ...props }: MenubarSeparatorProps): JSX.Element {
  return <MenubarPrimitive.Separator className={cn('bg-muted mx-2 my-1 h-px', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarShortcut
 * -------------------------------------------------------------------------- */

type MenubarShortcutProps = ComponentProps<'span'>;

function MenubarShortcut({ className, ...props }: MenubarShortcutProps): JSX.Element {
  return <span className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarArrow
 * -------------------------------------------------------------------------- */

type MenubarArrowProps = MenubarPrimitive.MenubarArrowProps;

function MenubarArrow({ className, ...props }: MenubarArrowProps): JSX.Element {
  return <MenubarPrimitive.Arrow className={cn('fill-popover', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  MenubarArrowProps,
  MenubarCheckboxItemProps,
  MenubarContentProps,
  MenubarGroupProps,
  MenubarItemProps,
  MenubarLabelProps,
  MenubarMenuProps,
  MenubarProps,
  MenubarRadioGroupProps,
  MenubarRadioItemProps,
  MenubarSeparatorProps,
  MenubarShortcutProps,
  MenubarSubContentProps,
  MenubarSubProps,
  MenubarSubTriggerProps,
  MenubarTriggerProps,
};
export {
  Menubar,
  MenubarArrow,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
