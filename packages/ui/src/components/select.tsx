import type { ComponentProps, JSX } from 'react';

import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants'; /* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

/* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

type SelectProps = ComponentProps<typeof SelectPrimitive.Root>;
const Select = SelectPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SelectGroup
 * -------------------------------------------------------------------------- */

type SelectGroupProps = ComponentProps<typeof SelectPrimitive.Group>;
const SelectGroup = SelectPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: SelectValue
 * -------------------------------------------------------------------------- */

type SelectValueProps = ComponentProps<typeof SelectPrimitive.Value>;
const SelectValue = SelectPrimitive.Value;

/* -----------------------------------------------------------------------------
 * Component: SelectTrigger
 * -------------------------------------------------------------------------- */

interface SelectTriggerProps extends ComponentProps<typeof SelectPrimitive.Trigger> {
  size?: ButtonVariantsProps['size'];
}

function SelectTrigger({ children, className, size, ...props }: SelectTriggerProps): JSX.Element {
  return (
    <SelectPrimitive.Trigger
      className={buttonVariants({
        className: ['w-full justify-between px-3 font-normal', '[&>span]:truncate', className],
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
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollUpButton
 * -------------------------------------------------------------------------- */

type SelectScrollUpButtonProps = ComponentProps<typeof SelectPrimitive.ScrollUpButton>;

function SelectScrollUpButton({ className, ...props }: SelectScrollUpButtonProps): JSX.Element {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn('flex items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollDownButton
 * -------------------------------------------------------------------------- */

type SelectScrollDownButtonProps = ComponentProps<typeof SelectPrimitive.ScrollDownButton>;

function SelectScrollDownButton({ className, ...props }: SelectScrollDownButtonProps): JSX.Element {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn('flex items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectContent
 * -------------------------------------------------------------------------- */

type SelectContentProps = ComponentProps<typeof SelectPrimitive.Content>;

function SelectContent({
  children,
  className,
  position = 'popper',
  ...props
}: SelectContentProps): JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
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
              'h-(--radix-select-trigger-height) min-w-(--radix-select-trigger-width) w-full',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectLabel
 * -------------------------------------------------------------------------- */

type SelectLabelProps = ComponentProps<typeof SelectPrimitive.Label>;

function SelectLabel({ className, ...props }: SelectLabelProps): JSX.Element {
  return (
    <SelectPrimitive.Label
      className={cn('gap-x-2 px-3 py-1.5', 'flex items-center text-sm font-semibold', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item>;

function SelectItem({ children, className, ...props }: SelectItemProps): JSX.Element {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm',
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
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectSeparator
 * -------------------------------------------------------------------------- */

type SelectSeparatorProps = ComponentProps<typeof SelectPrimitive.Separator>;

function SelectSeparator({ className, ...props }: SelectSeparatorProps): JSX.Element {
  return (
    <SelectPrimitive.Separator className={cn('bg-muted mx-2 my-1 h-px', className)} {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  SelectContentProps,
  SelectGroupProps,
  SelectItemProps,
  SelectLabelProps,
  SelectProps,
  SelectScrollDownButtonProps,
  SelectScrollUpButtonProps,
  SelectSeparatorProps,
  SelectTriggerProps,
  SelectValueProps,
};
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
};
