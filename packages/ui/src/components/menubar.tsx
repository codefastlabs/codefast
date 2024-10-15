import { cn } from '@/lib/utils';
import {
  CheckIcon,
  ChevronRightIcon,
  DotFilledIcon,
} from '@radix-ui/react-icons';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
} from 'react';

/* -----------------------------------------------------------------------------
 * Component: MenubarMenu
 * -------------------------------------------------------------------------- */

type MenubarMenuProps = ComponentProps<typeof MenubarPrimitive.Menu>;
const MenubarMenu = MenubarPrimitive.Menu;

/* -----------------------------------------------------------------------------
 * Component: MenubarGroup
 * -------------------------------------------------------------------------- */

type MenubarGroupProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.Group
>;
const MenubarGroup = MenubarPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: MenubarSub
 * -------------------------------------------------------------------------- */

type MenubarSubProps = ComponentPropsWithoutRef<typeof MenubarPrimitive.Sub>;
const MenubarSub = MenubarPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioGroup
 * -------------------------------------------------------------------------- */

type MenubarRadioGroupProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.RadioGroup
>;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: Menubar
 * -------------------------------------------------------------------------- */

type MenubarElement = ComponentRef<typeof MenubarPrimitive.Root>;
type MenubarProps = ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>;

const Menubar = forwardRef<MenubarElement, MenubarProps>(
  ({ className, ...props }, forwardedRef) => (
    <MenubarPrimitive.Root
      ref={forwardedRef}
      className={cn(
        'bg-background flex h-10 items-center space-x-1 rounded-md border p-1',
        className,
      )}
      {...props}
    />
  ),
);

Menubar.displayName = MenubarPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarTrigger
 * -------------------------------------------------------------------------- */

type MenubarTriggerElement = ComponentRef<typeof MenubarPrimitive.Trigger>;
type MenubarTriggerProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.Trigger
>;

const MenubarTrigger = forwardRef<MenubarTriggerElement, MenubarTriggerProps>(
  ({ className, ...props }, forwardedRef) => (
    <MenubarPrimitive.Trigger
      ref={forwardedRef}
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'flex cursor-pointer select-none items-center rounded-sm text-sm font-medium',
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

type MenubarSubTriggerElement = ComponentRef<
  typeof MenubarPrimitive.SubTrigger
>;

interface MenubarSubTriggerProps
  extends ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> {
  inset?: boolean;
}

const MenubarSubTrigger = forwardRef<
  MenubarSubTriggerElement,
  MenubarSubTriggerProps
>(({ children, className, inset, ...props }, forwardedRef) => (
  <MenubarPrimitive.SubTrigger
    ref={forwardedRef}
    className={cn(
      'gap-x-2 px-3 py-1.5',
      'flex cursor-pointer select-none items-center rounded-sm text-sm',
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
));

MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarSubContent
 * -------------------------------------------------------------------------- */

type MenubarSubContentElement = ComponentRef<
  typeof MenubarPrimitive.SubContent
>;
type MenubarSubContentProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.SubContent
>;

const MenubarSubContent = forwardRef<
  MenubarSubContentElement,
  MenubarSubContentProps
>(({ className, ...props }, forwardedRef) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.SubContent
      ref={forwardedRef}
      className={cn(
        'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
        'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
        'data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
        'data-[state=open]:data-[side=right]:slide-in-from-left-2',
        'data-[state=open]:data-[side=bottom]:slide-in-from-top-2',
        'data-[state=open]:data-[side=left]:slide-in-from-right-2',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
        'data-[state=closed]:data-[side=top]:slide-out-to-bottom-2',
        'data-[state=closed]:data-[side=left]:slide-out-to-right-2',
        'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2',
        'data-[state=closed]:data-[side=right]:slide-out-to-left-2',
        className,
      )}
      {...props}
    />
  </MenubarPrimitive.Portal>
));

MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarContent
 * -------------------------------------------------------------------------- */

type MenubarContentElement = ComponentRef<typeof MenubarPrimitive.Content>;
type MenubarContentProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.Content
>;

const MenubarContent = forwardRef<MenubarContentElement, MenubarContentProps>(
  (
    { className, align = 'start', alignOffset = -4, sideOffset = 8, ...props },
    forwardedRef,
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={forwardedRef}
        align={align}
        alignOffset={alignOffset}
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2',
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

type MenubarItemElement = ComponentRef<typeof MenubarPrimitive.Item>;

interface MenubarItemProps
  extends ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> {
  inset?: boolean;
}

const MenubarItem = forwardRef<MenubarItemElement, MenubarItemProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <MenubarPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'relative flex cursor-pointer select-none items-center rounded-sm text-sm',
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

type MenubarCheckboxItemElement = ComponentRef<
  typeof MenubarPrimitive.CheckboxItem
>;
type MenubarCheckboxItemProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.CheckboxItem
>;

const MenubarCheckboxItem = forwardRef<
  MenubarCheckboxItemElement,
  MenubarCheckboxItemProps
>(({ children, className, checked, ...props }, forwardedRef) => (
  <MenubarPrimitive.CheckboxItem
    ref={forwardedRef}
    checked={checked}
    className={cn(
      'gap-x-2 px-3 py-1.5',
      'pl-8',
      'relative flex cursor-pointer select-none items-center rounded-sm text-sm',
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
));

MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioItem
 * -------------------------------------------------------------------------- */

type MenubarRadioItemElement = ComponentRef<typeof MenubarPrimitive.RadioItem>;
type MenubarRadioItemProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.RadioItem
>;

const MenubarRadioItem = forwardRef<
  MenubarRadioItemElement,
  MenubarRadioItemProps
>(({ children, className, ...props }, forwardedRef) => (
  <MenubarPrimitive.RadioItem
    ref={forwardedRef}
    className={cn(
      'gap-x-2 px-3 py-1.5',
      'pl-8',
      'relative flex cursor-pointer select-none items-center rounded-sm text-sm',
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
));

MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarLabel
 * -------------------------------------------------------------------------- */

type MenubarLabelElement = ComponentRef<typeof MenubarPrimitive.Label>;

interface MenubarLabelProps
  extends ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> {
  inset?: boolean;
}

const MenubarLabel = forwardRef<MenubarLabelElement, MenubarLabelProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <MenubarPrimitive.Label
      ref={forwardedRef}
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'flex items-center text-sm font-semibold',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  ),
);

MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarSeparator
 * -------------------------------------------------------------------------- */

type MenubarSeparatorElement = ComponentRef<typeof MenubarPrimitive.Separator>;
type MenubarSeparatorProps = ComponentPropsWithoutRef<
  typeof MenubarPrimitive.Separator
>;

const MenubarSeparator = forwardRef<
  MenubarSeparatorElement,
  MenubarSeparatorProps
>(({ className, ...props }, forwardedRef) => (
  <MenubarPrimitive.Separator
    ref={forwardedRef}
    className={cn('bg-muted mx-2 my-1 h-px', className)}
    {...props}
  />
));

MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: MenubarShortcut
 * -------------------------------------------------------------------------- */

type MenubarShortcutProps = HTMLAttributes<HTMLSpanElement>;

function MenubarShortcut({
  className,
  ...props
}: MenubarShortcutProps): JSX.Element {
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
 * Component: MenubarArrow
 * -------------------------------------------------------------------------- */

type MenubarArrowElement = ComponentRef<typeof MenubarPrimitive.Arrow>;
type MenubarArrowProps = MenubarPrimitive.MenubarArrowProps;

const MenubarArrow = forwardRef<MenubarArrowElement, MenubarArrowProps>(
  ({ className, ...props }, forwardedRef) => (
    <MenubarPrimitive.Arrow
      ref={forwardedRef}
      className={cn('fill-popover', className)}
      {...props}
    />
  ),
);

MenubarArrow.displayName = MenubarPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
  type MenubarArrowProps,
  type MenubarCheckboxItemProps,
  type MenubarContentProps,
  type MenubarGroupProps,
  type MenubarItemProps,
  type MenubarLabelProps,
  type MenubarMenuProps,
  type MenubarProps,
  type MenubarRadioGroupProps,
  type MenubarRadioItemProps,
  type MenubarSeparatorProps,
  type MenubarShortcutProps,
  type MenubarSubContentProps,
  type MenubarSubProps,
  type MenubarSubTriggerProps,
  type MenubarTriggerProps,
};
