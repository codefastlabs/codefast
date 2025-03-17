import type { ComponentProps, JSX } from 'react';

import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { CheckIcon, ChevronRightIcon, DotIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Menubar
 * -------------------------------------------------------------------------- */

function Menubar({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Root>): JSX.Element {
  return (
    <MenubarPrimitive.Root
      className={cn('bg-background flex items-center space-x-1 rounded-lg border p-1', className)}
      data-slot="menubar"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarMenu
 * -------------------------------------------------------------------------- */

function MenubarMenu({ ...props }: ComponentProps<typeof MenubarPrimitive.Menu>): JSX.Element {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarGroup
 * -------------------------------------------------------------------------- */

function MenubarGroup({ ...props }: ComponentProps<typeof MenubarPrimitive.Group>): JSX.Element {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSub
 * -------------------------------------------------------------------------- */

function MenubarSub({ ...props }: ComponentProps<typeof MenubarPrimitive.Sub>): JSX.Element {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioGroup
 * -------------------------------------------------------------------------- */

function MenubarRadioGroup({ ...props }: ComponentProps<typeof MenubarPrimitive.RadioGroup>): JSX.Element {
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarTrigger
 * -------------------------------------------------------------------------- */

function MenubarTrigger({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Trigger>): JSX.Element {
  return (
    <MenubarPrimitive.Trigger
      className={cn(
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground outline-hidden flex select-none items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm font-medium',
        className,
      )}
      data-slot="menubar-trigger"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSubTrigger
 * -------------------------------------------------------------------------- */

function MenubarSubTrigger({
  children,
  className,
  inset,
  ...props
}: ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean;
}): JSX.Element {
  return (
    <MenubarPrimitive.SubTrigger
      className={cn(
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-inset:pl-8 outline-hidden flex cursor-default select-none items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm',
        className,
      )}
      data-inset={inset}
      data-slot="menubar-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </MenubarPrimitive.SubTrigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSubContent
 * -------------------------------------------------------------------------- */

function MenubarSubContent({ className, ...props }: ComponentProps<typeof MenubarPrimitive.SubContent>): JSX.Element {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 min-w-32 rounded-lg border p-1 shadow-lg',
          className,
        )}
        data-slot="menubar-sub-content"
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarContent
 * -------------------------------------------------------------------------- */

function MenubarContent({
  align = 'start',
  alignOffset = -4,
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof MenubarPrimitive.Content>): JSX.Element {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        align={align}
        alignOffset={alignOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 z-50 min-w-32 rounded-lg border p-1 shadow-lg',
          className,
        )}
        data-slot="menubar-content"
        sideOffset={sideOffset}
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarItem
 * -------------------------------------------------------------------------- */

function MenubarItem({
  className,
  inset,
  variant,
  ...props
}: ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}): JSX.Element {
  return (
    <MenubarPrimitive.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-inset:pl-8 outline-hidden group/menubar-item data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive/80 [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default select-none items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        className,
      )}
      data-inset={inset}
      data-slot="menubar-item"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarCheckboxItem
 * -------------------------------------------------------------------------- */

function MenubarCheckboxItem({
  checked,
  children,
  className,
  ...props
}: ComponentProps<typeof MenubarPrimitive.CheckboxItem>): JSX.Element {
  return (
    <MenubarPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground outline-hidden group/menubar-item relative flex cursor-default select-none items-center gap-x-2 rounded-sm py-1.5 pl-8 pr-2 text-sm aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        className,
      )}
      data-slot="menubar-checkbox-item"
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioItem
 * -------------------------------------------------------------------------- */

function MenubarRadioItem({
  children,
  className,
  ...props
}: ComponentProps<typeof MenubarPrimitive.RadioItem>): JSX.Element {
  return (
    <MenubarPrimitive.RadioItem
      className={cn(
        "focus:bg-accent focus:text-accent-foreground outline-hidden group/menubar-item relative flex cursor-default select-none items-center gap-x-2 rounded-sm py-1.5 pl-8 pr-2 text-sm aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        className,
      )}
      data-slot="menubar-radio-item"
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <DotIcon className="size-4 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarLabel
 * -------------------------------------------------------------------------- */

function MenubarLabel({
  className,
  inset,
  ...props
}: ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean;
}): JSX.Element {
  return (
    <MenubarPrimitive.Label
      className={cn('data-inset:pl-8 flex items-center gap-x-2 px-2 py-1.5 text-sm font-semibold', className)}
      data-inset={inset}
      data-slot="menubar-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSeparator
 * -------------------------------------------------------------------------- */

function MenubarSeparator({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Separator>): JSX.Element {
  return (
    <MenubarPrimitive.Separator
      className={cn('bg-border mx-2 my-1 h-px', className)}
      data-slot="menubar-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarShortcut
 * -------------------------------------------------------------------------- */

function MenubarShortcut({ className, ...props }: ComponentProps<'span'>): JSX.Element {
  return (
    <span
      className={cn(
        'text-muted-foreground group-data-[variant=destructive]/menubar-item:text-destructive/80 ml-auto text-xs tracking-widest',
        className,
      )}
      data-slot="menubar-shortcut"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarArrow
 * -------------------------------------------------------------------------- */

function MenubarArrow({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Arrow>): JSX.Element {
  return <MenubarPrimitive.Arrow className={cn('fill-popover', className)} data-slot="menubar-arrow" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Menubar,
  MenubarArrow,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
