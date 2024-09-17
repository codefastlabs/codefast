'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, DotFilledIcon } from '@radix-ui/react-icons';
import { dropdownMenuVariants } from '@/styles/dropdown-menu-variants';

/* -----------------------------------------------------------------------------
 * Variant: DropdownMenu
 * -------------------------------------------------------------------------- */

const { subTrigger, subContent, content, item, checkboxItem, itemIndicator, label, separator, shortcut } =
  dropdownMenuVariants();

/* -----------------------------------------------------------------------------
 * Component: DropdownMenu
 * -------------------------------------------------------------------------- */

type DropdownMenuProps = React.ComponentProps<typeof DropdownMenuPrimitive.Root>;
const DropdownMenu = DropdownMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuTriggerProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuGroup
 * -------------------------------------------------------------------------- */

type DropdownMenuGroupProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSub
 * -------------------------------------------------------------------------- */

type DropdownMenuSubProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioGroupProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioGroup>;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuSubTriggerElement = React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>;

interface DropdownMenuSubTriggerProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

const DropdownMenuSubTrigger = React.forwardRef<DropdownMenuSubTriggerElement, DropdownMenuSubTriggerProps>(
  ({ children, className, inset, ...props }, forwardedRef) => (
    <DropdownMenuPrimitive.SubTrigger ref={forwardedRef} className={subTrigger({ inset, className })} {...props}>
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  ),
);

DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubContent
 * -------------------------------------------------------------------------- */

type DropdownMenuSubContentProps = DropdownMenuPrimitive.DropdownMenuSubContentProps;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>(({ className, ...props }, forwardedRef) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.SubContent ref={forwardedRef} className={subContent({ className })} {...props} />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuContent
 * -------------------------------------------------------------------------- */

type DropdownMenuContentElement = React.ElementRef<typeof DropdownMenuPrimitive.Content>;
type DropdownMenuContentProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;

const DropdownMenuContent = React.forwardRef<DropdownMenuContentElement, DropdownMenuContentProps>(
  ({ className, sideOffset = 6, ...props }, forwardedRef) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={forwardedRef}
        className={content({ className })}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  ),
);

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuItem
 * -------------------------------------------------------------------------- */

type DropdownMenuItemElement = React.ElementRef<typeof DropdownMenuPrimitive.Item>;

interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
}

const DropdownMenuItem = React.forwardRef<DropdownMenuItemElement, DropdownMenuItemProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <DropdownMenuPrimitive.Item ref={forwardedRef} className={item({ inset, className })} {...props} />
  ),
);

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type DropdownMenuCheckboxItemElement = React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>;
type DropdownMenuCheckboxItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>;

const DropdownMenuCheckboxItem = React.forwardRef<DropdownMenuCheckboxItemElement, DropdownMenuCheckboxItemProps>(
  ({ children, className, checked, ...props }, forwardedRef) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={forwardedRef}
      checked={checked}
      className={checkboxItem({ className })}
      {...props}
    >
      <span className={itemIndicator()}>
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  ),
);

DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuRadioItem
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioItemElement = React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>;
type DropdownMenuRadioItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>;

const DropdownMenuRadioItem = React.forwardRef<DropdownMenuRadioItemElement, DropdownMenuRadioItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <DropdownMenuPrimitive.RadioItem ref={forwardedRef} className={checkboxItem({ className })} {...props}>
      <span className={itemIndicator()}>
        <DropdownMenuPrimitive.ItemIndicator>
          <DotFilledIcon className="size-4 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  ),
);

DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuLabel
 * -------------------------------------------------------------------------- */

type DropdownMenuLabelElement = React.ElementRef<typeof DropdownMenuPrimitive.Label>;

interface DropdownMenuLabelProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
}

const DropdownMenuLabel = React.forwardRef<DropdownMenuLabelElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <DropdownMenuPrimitive.Label ref={forwardedRef} className={label({ inset, className })} {...props} />
  ),
);

DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSeparator
 * -------------------------------------------------------------------------- */

type DropdownMenuSeparatorElement = React.ElementRef<typeof DropdownMenuPrimitive.Separator>;
type DropdownMenuSeparatorProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>;

const DropdownMenuSeparator = React.forwardRef<DropdownMenuSeparatorElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <DropdownMenuPrimitive.Separator ref={forwardedRef} className={separator({ className })} {...props} />
  ),
);

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuShortcut
 * -------------------------------------------------------------------------- */

type DropdownMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps): React.JSX.Element {
  return <span className={shortcut({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  type DropdownMenuProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuGroupProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuRadioGroupProps,
};
