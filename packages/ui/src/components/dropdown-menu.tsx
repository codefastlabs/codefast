import { cn } from '@/lib/utils';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
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

/* -----------------------------------------------------------------------------
 * Component: DropdownMenu
 * -------------------------------------------------------------------------- */

type DropdownMenuProps = ComponentProps<typeof DropdownMenuPrimitive.Root>;
const DropdownMenu = DropdownMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuTriggerProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Trigger
>;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuGroup
 * -------------------------------------------------------------------------- */

type DropdownMenuGroupProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Group
>;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSub
 * -------------------------------------------------------------------------- */

type DropdownMenuSubProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Sub
>;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioGroupProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioGroup
>;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuSubTriggerElement = ComponentRef<
  typeof DropdownMenuPrimitive.SubTrigger
>;

interface DropdownMenuSubTriggerProps
  extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

const DropdownMenuSubTrigger = forwardRef<
  DropdownMenuSubTriggerElement,
  DropdownMenuSubTriggerProps
>(({ children, className, inset, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.SubTrigger
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
  </DropdownMenuPrimitive.SubTrigger>
));

DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubContent
 * -------------------------------------------------------------------------- */

type DropdownMenuSubContentProps =
  DropdownMenuPrimitive.DropdownMenuSubContentProps;

const DropdownMenuSubContent = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>(({ className, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.SubContent
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
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuContent
 * -------------------------------------------------------------------------- */

type DropdownMenuContentElement = ComponentRef<
  typeof DropdownMenuPrimitive.Content
>;
type DropdownMenuContentProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
>;

const DropdownMenuContent = forwardRef<
  DropdownMenuContentElement,
  DropdownMenuContentProps
>(({ className, sideOffset = 6, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
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
      sideOffset={sideOffset}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuItem
 * -------------------------------------------------------------------------- */

type DropdownMenuItemElement = ComponentRef<typeof DropdownMenuPrimitive.Item>;

interface DropdownMenuItemProps
  extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
}

const DropdownMenuItem = forwardRef<
  DropdownMenuItemElement,
  DropdownMenuItemProps
>(({ className, inset, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.Item
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

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type DropdownMenuCheckboxItemElement = ComponentRef<
  typeof DropdownMenuPrimitive.CheckboxItem
>;
type DropdownMenuCheckboxItemProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.CheckboxItem
>;

const DropdownMenuCheckboxItem = forwardRef<
  DropdownMenuCheckboxItemElement,
  DropdownMenuCheckboxItemProps
>(({ children, className, checked, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.CheckboxItem
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
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuRadioItem
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioItemElement = ComponentRef<
  typeof DropdownMenuPrimitive.RadioItem
>;
type DropdownMenuRadioItemProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioItem
>;

const DropdownMenuRadioItem = forwardRef<
  DropdownMenuRadioItemElement,
  DropdownMenuRadioItemProps
>(({ children, className, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.RadioItem
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
      <DropdownMenuPrimitive.ItemIndicator>
        <DotFilledIcon className="size-4 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));

DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuLabel
 * -------------------------------------------------------------------------- */

type DropdownMenuLabelElement = ComponentRef<
  typeof DropdownMenuPrimitive.Label
>;

interface DropdownMenuLabelProps
  extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
}

const DropdownMenuLabel = forwardRef<
  DropdownMenuLabelElement,
  DropdownMenuLabelProps
>(({ className, inset, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.Label
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

DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSeparator
 * -------------------------------------------------------------------------- */

type DropdownMenuSeparatorElement = ComponentRef<
  typeof DropdownMenuPrimitive.Separator
>;
type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Separator
>;

const DropdownMenuSeparator = forwardRef<
  DropdownMenuSeparatorElement,
  DropdownMenuSeparatorProps
>(({ className, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.Separator
    ref={forwardedRef}
    className={cn('bg-muted mx-2 my-1 h-px', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuShortcut
 * -------------------------------------------------------------------------- */

type DropdownMenuShortcutProps = HTMLAttributes<HTMLSpanElement>;

function DropdownMenuShortcut({
  className,
  ...props
}: DropdownMenuShortcutProps): JSX.Element {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuArrow
 * -------------------------------------------------------------------------- */

type DropdownMenuArrowElement = ComponentRef<
  typeof DropdownMenuPrimitive.Arrow
>;
type DropdownMenuArrowProps = DropdownMenuPrimitive.DropdownMenuArrowProps;

const DropdownMenuArrow = forwardRef<
  DropdownMenuArrowElement,
  DropdownMenuArrowProps
>(({ className, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.Arrow
    ref={forwardedRef}
    className={cn('fill-popover', className)}
    {...props}
  />
));

DropdownMenuArrow.displayName = DropdownMenuPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuArrowProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuContentProps,
  type DropdownMenuGroupProps,
  type DropdownMenuItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuProps,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuTriggerProps,
};
