'use client';

import * as React from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

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
interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  size?: ButtonVariantsProps['size'];
}

const SelectTrigger = React.forwardRef<SelectTriggerElement, SelectTriggerProps>(
  ({ children, className, size, ...props }, forwardedRef) => (
    <SelectPrimitive.Trigger
      ref={forwardedRef}
      className={buttonVariants({
        variant: 'outline',
        size,
        className: ['w-full justify-between font-normal', className],
      })}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
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
    <SelectPrimitive.ScrollUpButton
      ref={forwardedRef}
      className={cn('flex cursor-pointer items-center justify-center py-1', className)}
      {...props}
    >
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
    <SelectPrimitive.ScrollDownButton
      ref={forwardedRef}
      className={cn('flex cursor-pointer items-center justify-center py-1', className)}
      {...props}
    >
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
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
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
  <SelectPrimitive.Label ref={forwardedRef} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
));

SelectLabel.displayName = SelectPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

type SelectItemElement = React.ElementRef<typeof SelectPrimitive.Item>;
type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

const SelectItem = React.forwardRef<SelectItemElement, SelectItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <SelectPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
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
    <SelectPrimitive.Separator ref={forwardedRef} className={cn('bg-muted mx-2 my-1 h-px', className)} {...props} />
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