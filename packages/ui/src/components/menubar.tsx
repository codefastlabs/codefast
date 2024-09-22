'use client';

import * as React from 'react';
import { CheckIcon, ChevronRightIcon, DotFilledIcon } from '@radix-ui/react-icons';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: MenubarMenu
 * -------------------------------------------------------------------------- */

type MenubarMenuProps = React.ComponentProps<typeof MenubarPrimitive.Menu>;
const MenubarMenu = MenubarPrimitive.Menu;

/* -----------------------------------------------------------------------------
 * Component: MenubarGroup
 * -------------------------------------------------------------------------- */

type MenubarGroupProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Group>;
const MenubarGroup = MenubarPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: MenubarSub
 * -------------------------------------------------------------------------- */

type MenubarSubProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Sub>;
const MenubarSub = MenubarPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioGroup
 * -------------------------------------------------------------------------- */

type MenubarRadioGroupProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioGroup>;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: Menubar
 * -------------------------------------------------------------------------- */

type MenubarElement = React.ElementRef<typeof MenubarPrimitive.Root>;
type MenubarProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>;

const Menubar = React.forwardRef<MenubarElement, MenubarProps>(({ className, ...props }, forwardedRef) => (
  <MenubarPrimitive.Root
    ref={forwardedRef}
    className={cn('bg-background flex h-10 items-center space-x-1 rounded-md border p-1 shadow-sm', className)}
    {...props}
  />
));

Menubar.displayName = MenubarPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarTrigger
 * -------------------------------------------------------------------------- */

type MenubarTriggerElement = React.ElementRef<typeof MenubarPrimitive.Trigger>;
type MenubarTriggerProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>;

const MenubarTrigger = React.forwardRef<MenubarTriggerElement, MenubarTriggerProps>(
  ({ className, ...props }, forwardedRef) => (
    <MenubarPrimitive.Trigger
      ref={forwardedRef}
      className={cn(
        'flex cursor-pointer select-none items-center rounded-sm px-3 py-1 text-sm font-medium',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
        className,
      )}
      {...props}
    />
  ),
);

MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarSubTrigger
 * -------------------------------------------------------------------------- */

type MenubarSubTriggerElement = React.ElementRef<typeof MenubarPrimitive.SubTrigger>;

interface MenubarSubTriggerProps extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> {
  inset?: boolean;
}

const MenubarSubTrigger = React.forwardRef<MenubarSubTriggerElement, MenubarSubTriggerProps>(
  ({ children, className, inset, ...props }, forwardedRef) => (
    <MenubarPrimitive.SubTrigger
      ref={forwardedRef}
      className={cn(
        'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
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
  ),
);

MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarSubContent
 * -------------------------------------------------------------------------- */

type MenubarSubContentElement = React.ElementRef<typeof MenubarPrimitive.SubContent>;
type MenubarSubContentProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>;

const MenubarSubContent = React.forwardRef<MenubarSubContentElement, MenubarSubContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        ref={forwardedRef}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 z-50 min-w-32 rounded-md border p-1 shadow-md',
          className,
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  ),
);

MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarContent
 * -------------------------------------------------------------------------- */

type MenubarContentElement = React.ElementRef<typeof MenubarPrimitive.Content>;
type MenubarContentProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>;

const MenubarContent = React.forwardRef<MenubarContentElement, MenubarContentProps>(
  ({ className, align = 'start', alignOffset = -4, sideOffset = 8, ...props }, forwardedRef) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={forwardedRef}
        align={align}
        alignOffset={alignOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 z-50 min-w-32 rounded-md border p-1 shadow-md',
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </MenubarPrimitive.Portal>
  ),
);

MenubarContent.displayName = MenubarPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarItem
 * -------------------------------------------------------------------------- */

type MenubarItemElement = React.ElementRef<typeof MenubarPrimitive.Item>;

interface MenubarItemProps extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> {
  inset?: boolean;
}

const MenubarItem = React.forwardRef<MenubarItemElement, MenubarItemProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <MenubarPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  ),
);

MenubarItem.displayName = MenubarPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarCheckboxItem
 * -------------------------------------------------------------------------- */

type MenubarCheckboxItemElement = React.ElementRef<typeof MenubarPrimitive.CheckboxItem>;
type MenubarCheckboxItemProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>;

const MenubarCheckboxItem = React.forwardRef<MenubarCheckboxItemElement, MenubarCheckboxItemProps>(
  ({ children, className, checked, ...props }, forwardedRef) => (
    <MenubarPrimitive.CheckboxItem
      ref={forwardedRef}
      checked={checked}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
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
  ),
);

MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioItem
 * -------------------------------------------------------------------------- */

type MenubarRadioItemElement = React.ElementRef<typeof MenubarPrimitive.RadioItem>;
type MenubarRadioItemProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>;

const MenubarRadioItem = React.forwardRef<MenubarRadioItemElement, MenubarRadioItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <MenubarPrimitive.RadioItem
      ref={forwardedRef}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <DotFilledIcon className="size-4 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  ),
);

MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarLabel
 * -------------------------------------------------------------------------- */

type MenubarLabelElement = React.ElementRef<typeof MenubarPrimitive.Label>;

interface MenubarLabelProps extends React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> {
  inset?: boolean;
}

const MenubarLabel = React.forwardRef<MenubarLabelElement, MenubarLabelProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <MenubarPrimitive.Label
      ref={forwardedRef}
      className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  ),
);

MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarSeparator
 * -------------------------------------------------------------------------- */

type MenubarSeparatorElement = React.ElementRef<typeof MenubarPrimitive.Separator>;
type MenubarSeparatorProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>;

const MenubarSeparator = React.forwardRef<MenubarSeparatorElement, MenubarSeparatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <MenubarPrimitive.Separator ref={forwardedRef} className={cn('bg-border -mx-1 my-1 h-px', className)} {...props} />
  ),
);

MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarShortcut
 * -------------------------------------------------------------------------- */

type MenubarShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

function MenubarShortcut({ className, ...props }: MenubarShortcutProps): React.JSX.Element {
  return <span className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
  type MenubarProps,
  type MenubarMenuProps,
  type MenubarTriggerProps,
  type MenubarContentProps,
  type MenubarItemProps,
  type MenubarSeparatorProps,
  type MenubarLabelProps,
  type MenubarCheckboxItemProps,
  type MenubarRadioGroupProps,
  type MenubarRadioItemProps,
  type MenubarSubContentProps,
  type MenubarSubTriggerProps,
  type MenubarGroupProps,
  type MenubarSubProps,
  type MenubarShortcutProps,
};
