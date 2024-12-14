import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react';
import { type ComponentProps, type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';
import { type ButtonVariantsProps, buttonVariants } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

type SelectProps = ComponentProps<typeof SelectPrimitive.Root>;
const Select = SelectPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SelectGroup
 * -------------------------------------------------------------------------- */

type SelectGroupProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Group>;
const SelectGroup = SelectPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: SelectValue
 * -------------------------------------------------------------------------- */

type SelectValueProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Value>;
const SelectValue = SelectPrimitive.Value;

/* -----------------------------------------------------------------------------
 * Component: SelectTrigger
 * -------------------------------------------------------------------------- */

type SelectTriggerElement = ComponentRef<typeof SelectPrimitive.Trigger>;
interface SelectTriggerProps extends ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  size?: ButtonVariantsProps['size'];
}

const SelectTrigger = forwardRef<SelectTriggerElement, SelectTriggerProps>(
  ({ children, className, size, ...props }, forwardedRef) => (
    <SelectPrimitive.Trigger
      ref={forwardedRef}
      className={buttonVariants({
        className: ['w-full justify-between px-3 font-normal [&>span]:truncate', className],
        size,
        variant: 'outline',
      })}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
);

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectScrollUpButton
 * -------------------------------------------------------------------------- */

type SelectScrollUpButtonElement = ComponentRef<typeof SelectPrimitive.ScrollUpButton>;
type SelectScrollUpButtonProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>;

const SelectScrollUpButton = forwardRef<SelectScrollUpButtonElement, SelectScrollUpButtonProps>(
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

type SelectScrollDownButtonElement = ComponentRef<typeof SelectPrimitive.ScrollDownButton>;
type SelectScrollDownButtonProps = ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>;

const SelectScrollDownButton = forwardRef<SelectScrollDownButtonElement, SelectScrollDownButtonProps>(
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

type SelectContentElement = ComponentRef<typeof SelectPrimitive.Content>;
type SelectContentProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

const SelectContent = forwardRef<SelectContentElement, SelectContentProps>(
  ({ children, className, position = 'popper', ...props }, forwardedRef) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={forwardedRef}
        className={cn(
          'bg-popover text-popover-foreground relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=bottom]:slide-in-from-top-2',
          'data-[state=open]:data-[side=left]:slide-in-from-right-2',
          'data-[state=open]:data-[side=right]:slide-in-from-left-2',
          'data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
          'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2',
          'data-[state=closed]:data-[side=left]:slide-out-to-right-2',
          'data-[state=closed]:data-[side=right]:slide-out-to-left-2',
          'data-[state=closed]:data-[side=top]:slide-out-to-bottom-2',
          position === 'popper' && [
            'data-[side=bottom]:translate-y-1',
            'data-[side=left]:-translate-x-1',
            'data-[side=right]:translate-x-1',
            'data-[side=top]:-translate-y-1',
          ],
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

type SelectLabelElement = ComponentRef<typeof SelectPrimitive.Label>;
type SelectLabelProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;

const SelectLabel = forwardRef<SelectLabelElement, SelectLabelProps>(({ className, ...props }, forwardedRef) => (
  <SelectPrimitive.Label
    ref={forwardedRef}
    className={cn('gap-x-2 px-3 py-1.5', 'flex items-center text-sm font-semibold', className)}
    {...props}
  />
));

SelectLabel.displayName = SelectPrimitive.Label.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

type SelectItemElement = ComponentRef<typeof SelectPrimitive.Item>;
type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

const SelectItem = forwardRef<SelectItemElement, SelectItemProps>(({ children, className, ...props }, forwardedRef) => (
  <SelectPrimitive.Item
    ref={forwardedRef}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded py-1.5 pl-2 pr-8 text-sm',
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
));

SelectItem.displayName = SelectPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: SelectSeparator
 * -------------------------------------------------------------------------- */

type SelectSeparatorElement = ComponentRef<typeof SelectPrimitive.Separator>;
type SelectSeparatorProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>;

const SelectSeparator = forwardRef<SelectSeparatorElement, SelectSeparatorProps>(
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
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectContentProps,
  type SelectGroupProps,
  type SelectItemProps,
  type SelectLabelProps,
  type SelectProps,
  type SelectScrollDownButtonProps,
  type SelectScrollUpButtonProps,
  type SelectSeparatorProps,
  type SelectTriggerProps,
  type SelectValueProps,
};
