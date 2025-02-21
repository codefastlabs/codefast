import type { ComponentProps, JSX } from 'react';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, DotIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: DropdownMenu
 * -------------------------------------------------------------------------- */

type DropdownMenuProps = ComponentProps<typeof DropdownMenuPrimitive.Root>;
const DropdownMenu = DropdownMenuPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuTriggerProps = ComponentProps<typeof DropdownMenuPrimitive.Trigger>;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuGroup
 * -------------------------------------------------------------------------- */

type DropdownMenuGroupProps = ComponentProps<typeof DropdownMenuPrimitive.Group>;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSub
 * -------------------------------------------------------------------------- */

type DropdownMenuSubProps = ComponentProps<typeof DropdownMenuPrimitive.Sub>;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioGroupProps = ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

interface DropdownMenuSubTriggerProps extends ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

function DropdownMenuSubTrigger({ children, className, inset, ...props }: DropdownMenuSubTriggerProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'flex select-none items-center rounded-sm text-sm',
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
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubContent
 * -------------------------------------------------------------------------- */

type DropdownMenuSubContentProps = DropdownMenuPrimitive.DropdownMenuSubContentProps;

function DropdownMenuSubContent({ className, ...props }: DropdownMenuSubContentProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-motion-in data-[state=open]:motion-fade-in-0 data-[state=open]:motion-zoom-in-95',
          'data-[state=open]:data-[side=top]:motion-slide-in-b-2',
          'data-[state=open]:data-[side=right]:motion-slide-in-l-2',
          'data-[state=open]:data-[side=bottom]:motion-slide-in-t-2',
          'data-[state=open]:data-[side=left]:motion-slide-in-r-2',
          'data-[state=closed]:animate-motion-out data-[state=closed]:motion-fade-out-0 data-[state=closed]:motion-zoom-out-95',
          'data-[state=closed]:data-[side=top]:motion-slide-out-b-2',
          'data-[state=closed]:data-[side=right]:motion-slide-out-l-2',
          'data-[state=closed]:data-[side=bottom]:motion-slide-out-t-2',
          'data-[state=closed]:data-[side=left]:motion-slide-out-r-2',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuContent
 * -------------------------------------------------------------------------- */

type DropdownMenuContentProps = ComponentProps<typeof DropdownMenuPrimitive.Content>;

function DropdownMenuContent({ className, sideOffset = 6, ...props }: DropdownMenuContentProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-motion-in data-[state=open]:motion-fade-in-0 data-[state=open]:motion-zoom-in-95',
          'data-[state=open]:data-[side=top]:motion-slide-in-b-2',
          'data-[state=open]:data-[side=right]:motion-slide-in-l-2',
          'data-[state=open]:data-[side=bottom]:motion-slide-in-t-2',
          'data-[state=open]:data-[side=left]:motion-slide-in-r-2',
          'data-[state=closed]:animate-motion-out data-[state=closed]:motion-fade-out-0 data-[state=closed]:motion-zoom-out-95',
          'data-[state=closed]:data-[side=top]:motion-slide-out-b-2',
          'data-[state=closed]:data-[side=right]:motion-slide-out-l-2',
          'data-[state=closed]:data-[side=bottom]:motion-slide-out-t-2',
          'data-[state=closed]:data-[side=left]:motion-slide-out-r-2',
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuItem
 * -------------------------------------------------------------------------- */

interface DropdownMenuItemProps extends ComponentProps<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
}

function DropdownMenuItem({ className, inset, ...props }: DropdownMenuItemProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'relative flex select-none items-center rounded-sm text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:opacity-50',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type DropdownMenuCheckboxItemProps = ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>;

function DropdownMenuCheckboxItem({
  checked,
  children,
  className,
  ...props
}: DropdownMenuCheckboxItemProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'pl-8',
        'relative flex select-none items-center rounded-sm text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:opacity-50',
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
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuRadioItem
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioItemProps = ComponentProps<typeof DropdownMenuPrimitive.RadioItem>;

function DropdownMenuRadioItem({ children, className, ...props }: DropdownMenuRadioItemProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        'gap-x-2 px-3 py-1.5',
        'pl-8',
        'relative flex select-none items-center rounded-sm text-sm',
        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
        'aria-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <DotIcon className="size-4 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuLabel
 * -------------------------------------------------------------------------- */

interface DropdownMenuLabelProps extends ComponentProps<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
}

function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('gap-x-2 px-3 py-1.5', 'flex items-center text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSeparator
 * -------------------------------------------------------------------------- */

type DropdownMenuSeparatorProps = ComponentProps<typeof DropdownMenuPrimitive.Separator>;

function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps): JSX.Element {
  return <DropdownMenuPrimitive.Separator className={cn('bg-muted mx-2 my-1 h-px', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuShortcut
 * -------------------------------------------------------------------------- */

type DropdownMenuShortcutProps = ComponentProps<'span'>;

function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps): JSX.Element {
  return <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuArrow
 * -------------------------------------------------------------------------- */

type DropdownMenuArrowProps = DropdownMenuPrimitive.DropdownMenuArrowProps;

function DropdownMenuArrow({ className, ...props }: DropdownMenuArrowProps): JSX.Element {
  return <DropdownMenuPrimitive.Arrow className={cn('fill-popover', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  DropdownMenuArrowProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuContentProps,
  DropdownMenuGroupProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuProps,
  DropdownMenuRadioGroupProps,
  DropdownMenuRadioItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuShortcutProps,
  DropdownMenuSubContentProps,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
  DropdownMenuTriggerProps,
};
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
};
