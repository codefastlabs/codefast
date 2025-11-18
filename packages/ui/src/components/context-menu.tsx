'use client';

import type { ComponentProps, JSX } from 'react';

import { CheckIcon, ChevronRightIcon, DotIcon } from 'lucide-react';

import { cn } from '@codefast/tailwind-variants';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';

/* -----------------------------------------------------------------------------
 * Component: ContextMenu
 * -------------------------------------------------------------------------- */

type ContextMenuProps = ComponentProps<typeof ContextMenuPrimitive.Root>;

function ContextMenu({ ...props }: ContextMenuProps): JSX.Element {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuTrigger
 * -------------------------------------------------------------------------- */

type ContextMenuTriggerProps = ComponentProps<typeof ContextMenuPrimitive.Trigger>;

function ContextMenuTrigger({ ...props }: ContextMenuTriggerProps): JSX.Element {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuGroup
 * -------------------------------------------------------------------------- */

type ContextMenuGroupProps = ComponentProps<typeof ContextMenuPrimitive.Group>;

function ContextMenuGroup({ ...props }: ContextMenuGroupProps): JSX.Element {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSub
 * -------------------------------------------------------------------------- */

type ContextMenuSubProps = ComponentProps<typeof ContextMenuPrimitive.Sub>;

function ContextMenuSub({ ...props }: ContextMenuSubProps): JSX.Element {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioGroup
 * -------------------------------------------------------------------------- */

type ContextMenuRadioGroupProps = ComponentProps<typeof ContextMenuPrimitive.RadioGroup>;

function ContextMenuRadioGroup({ ...props }: ContextMenuRadioGroupProps): JSX.Element {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubTrigger
 * -------------------------------------------------------------------------- */

interface ContextMenuSubTriggerProps extends ComponentProps<typeof ContextMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

function ContextMenuSubTrigger({ children, className, inset, ...props }: ContextMenuSubTriggerProps): JSX.Element {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-inset:pl-8 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="context-menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubContent
 * -------------------------------------------------------------------------- */

type ContextMenuSubContentProps = ComponentProps<typeof ContextMenuPrimitive.SubContent>;

function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 ease-ui z-50 min-w-32 rounded-lg border p-1 shadow-lg',
          className,
        )}
        data-slot="context-menu-sub-content"
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuContent
 * -------------------------------------------------------------------------- */

type ContextMenuContentProps = ComponentProps<typeof ContextMenuPrimitive.Content>;

function ContextMenuContent({ className, ...props }: ContextMenuContentProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 ease-ui z-50 min-w-32 rounded-lg border p-1 shadow-lg',
          className,
        )}
        data-slot="context-menu-content"
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuItem
 * -------------------------------------------------------------------------- */

interface ContextMenuItemProps extends ComponentProps<typeof ContextMenuPrimitive.Item> {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}

function ContextMenuItem({ className, inset, variant, ...props }: ContextMenuItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground group/context-menu-item data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive/80 [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none aria-disabled:opacity-50 data-inset:pl-8 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="context-menu-item"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuCheckboxItem
 * -------------------------------------------------------------------------- */

type ContextMenuCheckboxItemProps = ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>;

function ContextMenuCheckboxItem({
  checked,
  children,
  className,
  ...props
}: ContextMenuCheckboxItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground group/context-menu-item relative flex cursor-default items-center gap-x-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none aria-disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="context-menu-checkbox-item"
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioItem
 * -------------------------------------------------------------------------- */

type ContextMenuRadioItemProps = ComponentProps<typeof ContextMenuPrimitive.RadioItem>;

function ContextMenuRadioItem({ children, className, ...props }: ContextMenuRadioItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(
        "focus:bg-accent focus:text-accent-foreground group/context-menu-item relative flex cursor-default items-center gap-x-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none aria-disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="context-menu-radio-item"
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <DotIcon className="size-4 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuLabel
 * -------------------------------------------------------------------------- */

interface ContextMenuLabelProps extends ComponentProps<typeof ContextMenuPrimitive.Label> {
  inset?: boolean;
}

function ContextMenuLabel({ className, inset, ...props }: ContextMenuLabelProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Label
      className={cn('flex items-center gap-x-2 px-2 py-1.5 text-sm font-semibold data-inset:pl-8', className)}
      data-inset={inset}
      data-slot="context-menu-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSeparator
 * -------------------------------------------------------------------------- */

type ContextMenuSeparatorProps = ComponentProps<typeof ContextMenuPrimitive.Separator>;

function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Separator
      className={cn('bg-border mx-2 my-1 h-px', className)}
      data-slot="context-menu-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuShortcut
 * -------------------------------------------------------------------------- */

type ContextMenuShortcutProps = ComponentProps<'span'>;

function ContextMenuShortcut({ className, ...props }: ContextMenuShortcutProps): JSX.Element {
  return (
    <span
      className={cn(
        'text-muted-foreground group-data-[variant=destructive]/context-menu-item:text-destructive/80 ml-auto text-xs tracking-widest',
        className,
      )}
      data-slot="context-menu-shortcut"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuArrow
 * -------------------------------------------------------------------------- */

type ContextMenuArrowProps = ComponentProps<typeof ContextMenuPrimitive.Arrow>;

function ContextMenuArrow({ className, ...props }: ContextMenuArrowProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Arrow className={cn('fill-popover', className)} data-slot="context-menu-arrow" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  ContextMenu,
  ContextMenuArrow,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
export type {
  ContextMenuArrowProps,
  ContextMenuCheckboxItemProps,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuProps,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemProps,
  ContextMenuSeparatorProps,
  ContextMenuShortcutProps,
  ContextMenuSubContentProps,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuTriggerProps,
};
