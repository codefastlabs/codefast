'use client';

import type { ComponentProps, JSX } from 'react';

import { CheckIcon, ChevronRightIcon, DotIcon } from 'lucide-react';

import { cn } from '@codefast/tailwind-variants';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

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
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-inset:pl-8',
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

type DropdownMenuSubContentProps = ComponentProps<typeof DropdownMenuPrimitive.SubContent>;

function DropdownMenuSubContent({ className, ...props }: DropdownMenuSubContentProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal">
      <DropdownMenuPrimitive.SubContent
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 ease-ui z-50 min-w-32 rounded-lg border p-1 shadow-lg',
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

function DropdownMenuContent({ className, sideOffset = 4, ...props }: DropdownMenuContentProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal">
      <DropdownMenuPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 ease-ui z-50 min-w-32 rounded-lg border p-1 shadow-lg',
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
        "focus:bg-accent focus:text-accent-foreground group/dropdown-menu-item data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive/80 [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none aria-disabled:opacity-50 data-inset:pl-8 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
        "focus:bg-accent focus:text-accent-foreground group/dropdown-menu-item relative flex cursor-default items-center gap-x-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none aria-disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="dropdown-menu-checkbox-item"
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
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
        "focus:bg-accent focus:text-accent-foreground group/dropdown-menu-item relative flex cursor-default items-center gap-x-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none aria-disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="dropdown-menu-radio-item"
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
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
      className={cn('flex items-center gap-x-2 px-2 py-1.5 text-sm font-semibold data-inset:pl-8', className)}
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
      className={cn('bg-border mx-2 my-1 h-px', className)}
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
      className={cn(
        'text-muted-foreground group-data-[variant=destructive]/dropdown-menu-item:text-destructive/80 ml-auto text-xs tracking-widest',
        className,
      )}
      data-slot="dropdown-menu-shortcut"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuArrow
 * -------------------------------------------------------------------------- */

type DropdownMenuArrowProps = ComponentProps<typeof DropdownMenuPrimitive.Arrow>;

function DropdownMenuArrow({ className, ...props }: DropdownMenuArrowProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Arrow className={cn('fill-popover', className)} data-slot="dropdown-menu-arrow" {...props} />
  );
}

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
};
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
