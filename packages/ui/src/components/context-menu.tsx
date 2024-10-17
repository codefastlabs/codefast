import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import {
  CheckIcon,
  ChevronRightIcon,
  DotFilledIcon,
} from '@radix-ui/react-icons';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
} from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: ContextMenu
 * -------------------------------------------------------------------------- */

type ContextMenuProps = ComponentProps<typeof ContextMenuPrimitive.Root>;
const ContextMenu = ContextMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuTriggerProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Trigger
>;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuGroup
 * -------------------------------------------------------------------------- */

type ContextMenuGroupProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Group
>;
const ContextMenuGroup = ContextMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSub
 * -------------------------------------------------------------------------- */

type ContextMenuSubProps = ComponentProps<typeof ContextMenuPrimitive.Sub>;
const ContextMenuSub = ContextMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioGroup
 * -------------------------------------------------------------------------- */

type ContextMenuRadioGroupProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.RadioGroup
>;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuSubTriggerElement = ComponentRef<
  typeof ContextMenuPrimitive.SubTrigger
>;

interface ContextMenuSubTriggerProps
  extends ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

const ContextMenuSubTrigger = forwardRef<
  ContextMenuSubTriggerElement,
  ContextMenuSubTriggerProps
>(({ children, className, inset, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.SubTrigger
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
  </ContextMenuPrimitive.SubTrigger>
));

ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubContent
 * -------------------------------------------------------------------------- */

type ContextMenuSubContentElement = ComponentRef<
  typeof ContextMenuPrimitive.SubContent
>;
type ContextMenuSubContentProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.SubContent
>;

const ContextMenuSubContent = forwardRef<
  ContextMenuSubContentElement,
  ContextMenuSubContentProps
>(({ className, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.SubContent
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
        'data-[state=closed]:data-[side=right]:slide-out-to-left-2',
        'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2',
        'data-[state=closed]:data-[side=left]:slide-out-to-right-2',
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));

ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuContent
 * -------------------------------------------------------------------------- */

type ContextMenuContentElement = ComponentRef<
  typeof ContextMenuPrimitive.Content
>;
type ContextMenuContentProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Content
>;

const ContextMenuContent = forwardRef<
  ContextMenuContentElement,
  ContextMenuContentProps
>(({ className, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={forwardedRef}
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
));

ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuItem
 * -------------------------------------------------------------------------- */

type ContextMenuItemElement = ComponentRef<typeof ContextMenuPrimitive.Item>;

interface ContextMenuItemProps
  extends ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> {
  inset?: boolean;
}

const ContextMenuItem = forwardRef<
  ContextMenuItemElement,
  ContextMenuItemProps
>(({ className, inset, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.Item
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
));

ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type ContextMenuCheckboxItemElement = ComponentRef<
  typeof ContextMenuPrimitive.CheckboxItem
>;
type ContextMenuCheckboxItemProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.CheckboxItem
>;

const ContextMenuCheckboxItem = forwardRef<
  ContextMenuCheckboxItemElement,
  ContextMenuCheckboxItemProps
>(({ children, className, checked, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.CheckboxItem
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
      <ContextMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));

ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioItem
 * -------------------------------------------------------------------------- */

type ContextMenuRadioItemElement = ComponentRef<
  typeof ContextMenuPrimitive.RadioItem
>;
type ContextMenuRadioItemProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.RadioItem
>;

const ContextMenuRadioItem = forwardRef<
  ContextMenuRadioItemElement,
  ContextMenuRadioItemProps
>(({ children, className, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.RadioItem
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
      <ContextMenuPrimitive.ItemIndicator>
        <DotFilledIcon className="size-4 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));

ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuLabel
 * -------------------------------------------------------------------------- */

type ContextMenuLabelElement = ComponentRef<typeof ContextMenuPrimitive.Label>;

interface ContextMenuLabelProps
  extends ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> {
  inset?: boolean;
}

const ContextMenuLabel = forwardRef<
  ContextMenuLabelElement,
  ContextMenuLabelProps
>(({ className, inset, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.Label
    ref={forwardedRef}
    className={cn(
      'gap-x-2 px-3 py-1.5',
      'flex items-center text-sm font-semibold',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));

ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSeparator
 * -------------------------------------------------------------------------- */

type ContextMenuSeparatorElement = ComponentRef<
  typeof ContextMenuPrimitive.Separator
>;
type ContextMenuSeparatorProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Separator
>;

const ContextMenuSeparator = forwardRef<
  ContextMenuSeparatorElement,
  ContextMenuSeparatorProps
>(({ className, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.Separator
    ref={forwardedRef}
    className={cn('bg-muted mx-2 my-1 h-px', className)}
    {...props}
  />
));

ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuShortcut
 * -------------------------------------------------------------------------- */

type ContextMenuShortcutProps = HTMLAttributes<HTMLSpanElement>;

function ContextMenuShortcut({
  className,
  ...props
}: ContextMenuShortcutProps): JSX.Element {
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
 * Component: ContextMenuArrow
 * -------------------------------------------------------------------------- */

type ContextMenuArrowElement = ComponentRef<typeof ContextMenuPrimitive.Arrow>;
type ContextMenuArrowProps = ContextMenuPrimitive.ContextMenuArrowProps;

const ContextMenuArrow = forwardRef<
  ContextMenuArrowElement,
  ContextMenuArrowProps
>(({ className, ...props }, forwardedRef) => (
  <ContextMenuPrimitive.Arrow
    ref={forwardedRef}
    className={cn('fill-popover', className)}
    {...props}
  />
));

ContextMenuArrow.displayName = ContextMenuPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
  type ContextMenuArrowProps,
  type ContextMenuCheckboxItemProps,
  type ContextMenuContentProps,
  type ContextMenuGroupProps,
  type ContextMenuItemProps,
  type ContextMenuLabelProps,
  type ContextMenuProps,
  type ContextMenuRadioGroupProps,
  type ContextMenuRadioItemProps,
  type ContextMenuSeparatorProps,
  type ContextMenuShortcutProps,
  type ContextMenuSubContentProps,
  type ContextMenuSubProps,
  type ContextMenuSubTriggerProps,
  type ContextMenuTriggerProps,
};
