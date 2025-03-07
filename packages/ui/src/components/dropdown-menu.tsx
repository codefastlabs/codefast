import type { ComponentProps, JSX } from 'react';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, DotIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: DropdownMenu
 * -------------------------------------------------------------------------- */

type DropdownMenuProps = ComponentProps<typeof DropdownMenuPrimitive.Root>;

function DropdownMenu({ ...props }: DropdownMenuProps): JSX.Element {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuTriggerProps = ComponentProps<typeof DropdownMenuPrimitive.Trigger>;

function DropdownMenuTrigger({ ...props }: DropdownMenuTriggerProps): JSX.Element {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuGroup
 * -------------------------------------------------------------------------- */

type DropdownMenuGroupProps = ComponentProps<typeof DropdownMenuPrimitive.Group>;

function DropdownMenuGroup({ ...props }: DropdownMenuGroupProps): JSX.Element {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSub
 * -------------------------------------------------------------------------- */

type DropdownMenuSubProps = ComponentProps<typeof DropdownMenuPrimitive.Sub>;

function DropdownMenuSub({ ...props }: DropdownMenuSubProps): JSX.Element {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

type DropdownMenuRadioGroupProps = ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>;

function DropdownMenuRadioGroup({ ...props }: DropdownMenuRadioGroupProps): JSX.Element {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

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
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-inset:pl-8 flex select-none items-center gap-x-2 rounded-sm px-3 py-1.5 text-sm focus:outline-none',
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-sub-trigger"
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
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-from-b-2 data-[state=open]:data-[side=right]:slide-from-l-2 data-[state=open]:data-[side=bottom]:slide-from-t-2 data-[state=open]:data-[side=left]:slide-from-r-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-to-b-2 data-[state=closed]:data-[side=right]:slide-to-l-2 data-[state=closed]:data-[side=bottom]:slide-to-t-2 data-[state=closed]:data-[side=left]:slide-to-r-2 z-50 min-w-32 rounded-lg border p-1 shadow-lg',
          className,
        )}
        data-slot="dropdown-menu-sub-content"
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
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-from-b-2 data-[state=open]:data-[side=right]:slide-from-l-2 data-[state=open]:data-[side=bottom]:slide-from-t-2 data-[state=open]:data-[side=left]:slide-from-r-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-to-b-2 data-[state=closed]:data-[side=right]:slide-to-l-2 data-[state=closed]:data-[side=bottom]:slide-to-t-2 data-[state=closed]:data-[side=left]:slide-to-r-2 z-50 min-w-32 rounded-lg border p-1 shadow-lg',
          className,
        )}
        data-slot="dropdown-menu-content"
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
  variant?: 'default' | 'destructive';
}

function DropdownMenuItem({ className, inset, variant, ...props }: DropdownMenuItemProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive-foreground data-inset:pl-8 group relative flex select-none items-center gap-x-2 rounded-sm px-3 py-1.5 text-sm focus:outline-none aria-disabled:opacity-50',
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-item"
      data-variant={variant}
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
        'focus:bg-accent focus:text-accent-foreground group relative flex select-none items-center gap-x-2 rounded-sm px-3 py-1.5 pl-8 text-sm focus:outline-none aria-disabled:opacity-50',
        className,
      )}
      data-slot="dropdown-menu-checkbox-item"
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
        'focus:bg-accent focus:text-accent-foreground group relative flex select-none items-center gap-x-2 rounded-sm px-3 py-1.5 pl-8 text-sm focus:outline-none aria-disabled:opacity-50',
        className,
      )}
      data-slot="dropdown-menu-radio-item"
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
      className={cn('data-inset:pl-8 flex items-center gap-x-2 px-3 py-1.5 text-sm font-semibold', className)}
      data-inset={inset}
      data-slot="dropdown-menu-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSeparator
 * -------------------------------------------------------------------------- */

type DropdownMenuSeparatorProps = ComponentProps<typeof DropdownMenuPrimitive.Separator>;

function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('bg-muted mx-2 my-1 h-px', className)}
      data-slot="dropdown-menu-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuShortcut
 * -------------------------------------------------------------------------- */

type DropdownMenuShortcutProps = ComponentProps<'span'>;

function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps): JSX.Element {
  return (
    <span
      className={cn('text-muted-foreground ml-auto text-xs tracking-widest group-focus:text-current', className)}
      data-slot="dropdown-menu-shortcut"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuArrow
 * -------------------------------------------------------------------------- */

type DropdownMenuArrowProps = DropdownMenuPrimitive.DropdownMenuArrowProps;

function DropdownMenuArrow({ className, ...props }: DropdownMenuArrowProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Arrow className={cn('fill-popover', className)} data-slot="dropdown-menu-arrow" {...props} />
  );
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
