import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

function Select({ ...props }: ComponentProps<typeof SelectPrimitive.Root>): JSX.Element {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectGroup
 * -------------------------------------------------------------------------- */

function SelectGroup({ ...props }: ComponentProps<typeof SelectPrimitive.Group>): JSX.Element {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectValue
 * -------------------------------------------------------------------------- */

function SelectValue({ ...props }: ComponentProps<typeof SelectPrimitive.Value>): JSX.Element {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectTrigger
 * -------------------------------------------------------------------------- */

function SelectTrigger({
  children,
  className,
  size,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: VariantProps<typeof buttonVariants>['size'];
}): JSX.Element {
  return (
    <SelectPrimitive.Trigger
      className={buttonVariants({
        className: [
          'focus:ring-ring focus:ring-3 focus:border-input-focus hover:not-disabled:border-input-hover w-full justify-between px-3 font-normal *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:truncate',
          className,
        ],
        size,
        variant: 'outline',
      })}
      data-slot="select-trigger"
      {...props}
    >
      {children}

      <SelectPrimitive.Icon asChild className="size-4 shrink-0 opacity-50">
        <ChevronsUpDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollUpButton
 * -------------------------------------------------------------------------- */

function SelectScrollUpButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpButton>): JSX.Element {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn('text-muted-foreground flex items-center justify-center py-1', className)}
      data-slot="select-scroll-up-button"
      {...props}
    >
      <ChevronUpIcon size={16} />
    </SelectPrimitive.ScrollUpButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollDownButton
 * -------------------------------------------------------------------------- */

function SelectScrollDownButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownButton>): JSX.Element {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn('text-muted-foreground flex items-center justify-center py-1', className)}
      data-slot="select-scroll-down-button"
      {...props}
    >
      <ChevronDownIcon size={16} />
    </SelectPrimitive.ScrollDownButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectContent
 * -------------------------------------------------------------------------- */

function SelectContent({
  children,
  className,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>): JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-from-b-2 data-[state=open]:data-[side=right]:slide-from-l-2 data-[state=open]:data-[side=bottom]:slide-from-t-2 data-[state=open]:data-[side=left]:slide-from-r-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-to-b-2 data-[state=closed]:data-[side=right]:slide-to-l-2 data-[state=closed]:data-[side=bottom]:slide-to-t-2 data-[state=closed]:data-[side=left]:slide-to-r-2 relative z-50 max-h-96 min-w-32 overflow-hidden rounded-lg border shadow-lg',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        data-slot="select-content"
        position={position}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' && 'h-(--radix-select-trigger-height) min-w-(--radix-select-trigger-width) w-full',
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

function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>): JSX.Element {
  return (
    <SelectPrimitive.Label
      className={cn('flex items-center gap-x-2 px-3 py-1.5 text-sm font-semibold', className)}
      data-slot="select-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

function SelectItem({ children, className, ...props }: ComponentProps<typeof SelectPrimitive.Item>): JSX.Element {
  return (
    <SelectPrimitive.Item
      className={cn(
        'focus:bg-accent focus:text-accent-foreground outline-hidden *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm aria-disabled:opacity-50',
        className,
      )}
      data-slot="select-item"
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

function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>): JSX.Element {
  return (
    <SelectPrimitive.Separator
      className={cn('bg-muted mx-2 my-1 h-px', className)}
      data-slot="select-separator"
      {...props}
    />
  );
}

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
};
