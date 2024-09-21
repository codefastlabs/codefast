'use client';

import * as React from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { CheckIcon, ChevronRightIcon, DotFilledIcon } from '@radix-ui/react-icons';
import { contextMenuVariant } from '@/styles/context-menu-variant';

/* -----------------------------------------------------------------------------
 * Variant: ContextMenu
 * -------------------------------------------------------------------------- */

const {
  subTrigger,
  subTriggerIcon,
  subContent,
  content,
  item,
  checkboxItem,
  radioItem,
  itemIndicator,
  radioItemIndicatorIcon,
  itemIndicatorIcon,
  label,
  separator,
  shortcut,
  arrow,
} = contextMenuVariant();

/* -----------------------------------------------------------------------------
 * Component: ContextMenu
 * -------------------------------------------------------------------------- */

type ContextMenuProps = React.ComponentProps<typeof ContextMenuPrimitive.Root>;
const ContextMenu = ContextMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuTriggerProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger>;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuGroup
 * -------------------------------------------------------------------------- */

type ContextMenuGroupProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Group>;
const ContextMenuGroup = ContextMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSub
 * -------------------------------------------------------------------------- */

type ContextMenuSubProps = React.ComponentProps<typeof ContextMenuPrimitive.Sub>;
const ContextMenuSub = ContextMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioGroup
 * -------------------------------------------------------------------------- */

type ContextMenuRadioGroupProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioGroup>;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuSubTriggerElement = React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>;

interface ContextMenuSubTriggerProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

const ContextMenuSubTrigger = React.forwardRef<ContextMenuSubTriggerElement, ContextMenuSubTriggerProps>(
  ({ children, className, inset, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.SubTrigger ref={forwardedRef} className={subTrigger({ inset, className })} {...props}>
      {children}
      <ChevronRightIcon className={subTriggerIcon()} />
    </ContextMenuPrimitive.SubTrigger>
  ),
);

ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubContent
 * -------------------------------------------------------------------------- */

type ContextMenuSubContentElement = React.ElementRef<typeof ContextMenuPrimitive.SubContent>;
type ContextMenuSubContentProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>;

const ContextMenuSubContent = React.forwardRef<ContextMenuSubContentElement, ContextMenuSubContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent ref={forwardedRef} className={subContent({ className })} {...props} />
    </ContextMenuPrimitive.Portal>
  ),
);

ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuContent
 * -------------------------------------------------------------------------- */

type ContextMenuContentElement = React.ElementRef<typeof ContextMenuPrimitive.Content>;
type ContextMenuContentProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>;

const ContextMenuContent = React.forwardRef<ContextMenuContentElement, ContextMenuContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content ref={forwardedRef} className={content({ className })} {...props} />
    </ContextMenuPrimitive.Portal>
  ),
);

ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuItem
 * -------------------------------------------------------------------------- */

type ContextMenuItemElement = React.ElementRef<typeof ContextMenuPrimitive.Item>;

interface ContextMenuItemProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> {
  inset?: boolean;
}

const ContextMenuItem = React.forwardRef<ContextMenuItemElement, ContextMenuItemProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.Item ref={forwardedRef} className={item({ inset, className })} {...props} />
  ),
);

ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type ContextMenuCheckboxItemElement = React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>;
type ContextMenuCheckboxItemProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>;

const ContextMenuCheckboxItem = React.forwardRef<ContextMenuCheckboxItemElement, ContextMenuCheckboxItemProps>(
  ({ children, className, checked, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.CheckboxItem
      ref={forwardedRef}
      checked={checked}
      className={checkboxItem({ className })}
      {...props}
    >
      <ContextMenuPrimitive.ItemIndicator className={itemIndicator()}>
        <CheckIcon className={itemIndicatorIcon()} />
      </ContextMenuPrimitive.ItemIndicator>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  ),
);

ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioItem
 * -------------------------------------------------------------------------- */

type ContextMenuRadioItemElement = React.ElementRef<typeof ContextMenuPrimitive.RadioItem>;
type ContextMenuRadioItemProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>;

const ContextMenuRadioItem = React.forwardRef<ContextMenuRadioItemElement, ContextMenuRadioItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.RadioItem ref={forwardedRef} className={radioItem({ className })} {...props}>
      <ContextMenuPrimitive.ItemIndicator className={itemIndicator()}>
        <DotFilledIcon className={radioItemIndicatorIcon()} />
      </ContextMenuPrimitive.ItemIndicator>
      {children}
    </ContextMenuPrimitive.RadioItem>
  ),
);

ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuLabel
 * -------------------------------------------------------------------------- */

type ContextMenuLabelElement = React.ElementRef<typeof ContextMenuPrimitive.Label>;

interface ContextMenuLabelProps extends React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> {
  inset?: boolean;
}

const ContextMenuLabel = React.forwardRef<ContextMenuLabelElement, ContextMenuLabelProps>(
  ({ className, inset, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.Label ref={forwardedRef} className={label({ inset, className })} {...props} />
  ),
);

ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSeparator
 * -------------------------------------------------------------------------- */

type ContextMenuSeparatorElement = React.ElementRef<typeof ContextMenuPrimitive.Separator>;
type ContextMenuSeparatorProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>;

const ContextMenuSeparator = React.forwardRef<ContextMenuSeparatorElement, ContextMenuSeparatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.Separator ref={forwardedRef} className={separator({ className })} {...props} />
  ),
);

ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Component: ContextMenuShortcut
 * -------------------------------------------------------------------------- */

type ContextMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

function ContextMenuShortcut({ className, ...props }: ContextMenuShortcutProps): React.JSX.Element {
  return <span className={shortcut({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuArrow
 * -------------------------------------------------------------------------- */

type ContextMenuArrowElement = React.ElementRef<typeof ContextMenuPrimitive.Arrow>;
type ContextMenuArrowProps = ContextMenuPrimitive.ContextMenuArrowProps;

const ContextMenuArrow = React.forwardRef<ContextMenuArrowElement, ContextMenuArrowProps>(
  ({ className, ...props }, forwardedRef) => (
    <ContextMenuPrimitive.Arrow ref={forwardedRef} className={arrow({ className })} {...props} />
  ),
);

ContextMenuArrow.displayName = ContextMenuPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
  ContextMenuArrow,
  type ContextMenuProps,
  type ContextMenuTriggerProps,
  type ContextMenuContentProps,
  type ContextMenuItemProps,
  type ContextMenuCheckboxItemProps,
  type ContextMenuRadioItemProps,
  type ContextMenuLabelProps,
  type ContextMenuSeparatorProps,
  type ContextMenuShortcutProps,
  type ContextMenuGroupProps,
  type ContextMenuSubProps,
  type ContextMenuSubContentProps,
  type ContextMenuSubTriggerProps,
  type ContextMenuRadioGroupProps,
  type ContextMenuArrowProps,
};
