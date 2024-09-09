'use client';

import * as React from 'react';
import { CaretSortIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Select
 * -------------------------------------------------------------------------- */

const selectVariants = tv({
  slots: {
    trigger: [
      'border-input flex w-full shrink-0 select-none items-center justify-between gap-2 whitespace-nowrap rounded-md border text-sm transition',
      '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-50',
      '[&_span]:truncate',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    scrollButton: 'flex cursor-pointer items-center justify-center py-1',
    content: [
      'bg-popover text-popover-foreground relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md',
      'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
      'data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
      'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2',
    ],
    viewport: 'p-1',
    label: 'px-2 py-1.5 text-sm font-semibold',
    item: [
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm',
      'aria-disabled:pointer-events-none aria-disabled:opacity-50',
      'focus:bg-accent focus:text-accent-foreground focus:outline-none',
    ],
    indicator: ['absolute right-2 flex size-3.5 items-center justify-center', '[&_svg]:size-4'],
    separator: 'bg-border -mx-1 my-1 h-px',
  },
  variants: {
    size: {
      xxs: { trigger: 'h-7 px-2' },
      xs: { trigger: 'h-8 px-2' },
      sm: { trigger: 'h-9 px-3' },
      md: { trigger: 'h-10 px-3' },
      lg: { trigger: 'h-11 px-4' },
      xl: { trigger: 'h-12 px-4' },
    },
    position: {
      popper: {
        content:
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        viewport: 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
      },
      'item-aligned': {},
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type SelectVariantsProps = VariantProps<typeof selectVariants>;

const { trigger, scrollButton, content, viewport, label, item, indicator, separator } = selectVariants();

/* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root>;
const Select = SelectPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SelectGroup
 * -------------------------------------------------------------------------- */

type SelectGroupProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>;
const SelectGroup = SelectPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: SelectValue
 * -------------------------------------------------------------------------- */

type SelectValueProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>;
const SelectValue = SelectPrimitive.Value;

/* -----------------------------------------------------------------------------
 * Component: SelectTrigger
 * -------------------------------------------------------------------------- */

type SelectTriggerElement = React.ElementRef<typeof SelectPrimitive.Trigger>;
interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    Pick<SelectVariantsProps, 'size'> {}

const SelectTrigger = React.forwardRef<SelectTriggerElement, SelectTriggerProps>(
  ({ children, className, size, ...props }, forwardedRef) => (
    <SelectPrimitive.Trigger ref={forwardedRef} className={trigger({ className, size })} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretSortIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
);

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectScrollUpButton
 * -------------------------------------------------------------------------- */

type SelectScrollUpButtonElement = React.ElementRef<typeof SelectPrimitive.ScrollUpButton>;
type SelectScrollUpButtonProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>;

const SelectScrollUpButton = React.forwardRef<SelectScrollUpButtonElement, SelectScrollUpButtonProps>(
  ({ className, ...props }, forwardedRef) => (
    <SelectPrimitive.ScrollUpButton ref={forwardedRef} className={scrollButton({ className })} {...props}>
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  ),
);

SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectScrollDownButton
 * -------------------------------------------------------------------------- */

type SelectScrollDownButtonElement = React.ElementRef<typeof SelectPrimitive.ScrollDownButton>;
type SelectScrollDownButtonProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>;

const SelectScrollDownButton = React.forwardRef<SelectScrollDownButtonElement, SelectScrollDownButtonProps>(
  ({ className, ...props }, forwardedRef) => (
    <SelectPrimitive.ScrollDownButton ref={forwardedRef} className={scrollButton({ className })} {...props}>
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  ),
);

SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectContent
 * -------------------------------------------------------------------------- */

type SelectContentElement = React.ElementRef<typeof SelectPrimitive.Content>;
type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

const SelectContent = React.forwardRef<SelectContentElement, SelectContentProps>(
  ({ children, className, position = 'popper', ...props }, forwardedRef) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={forwardedRef}
        className={content({ position, className })}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={viewport({ position })}>{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
);

SelectContent.displayName = SelectPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectLabel
 * -------------------------------------------------------------------------- */

type SelectLabelElement = React.ElementRef<typeof SelectPrimitive.Label>;
type SelectLabelProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;

const SelectLabel = React.forwardRef<SelectLabelElement, SelectLabelProps>(({ className, ...props }, forwardedRef) => (
  <SelectPrimitive.Label ref={forwardedRef} className={label({ className })} {...props} />
));

SelectLabel.displayName = SelectPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

type SelectItemElement = React.ElementRef<typeof SelectPrimitive.Item>;
type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

const SelectItem = React.forwardRef<SelectItemElement, SelectItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <SelectPrimitive.Item ref={forwardedRef} className={item({ className })} {...props}>
      <span className={indicator()}>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  ),
);

SelectItem.displayName = SelectPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectSeparator
 * -------------------------------------------------------------------------- */

type SelectSeparatorElement = React.ElementRef<typeof SelectPrimitive.Separator>;
type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>;

const SelectSeparator = React.forwardRef<SelectSeparatorElement, SelectSeparatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <SelectPrimitive.Separator ref={forwardedRef} className={separator({ className })} {...props} />
  ),
);

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  type SelectProps,
  type SelectGroupProps,
  type SelectValueProps,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectLabelProps,
  type SelectItemProps,
  type SelectSeparatorProps,
  type SelectScrollUpButtonProps,
  type SelectScrollDownButtonProps,
};
