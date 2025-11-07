"use client";

import type { ComponentProps, JSX } from "react";

import { CheckIcon, ChevronRightIcon, DotIcon } from "lucide-react";

import { cn } from "@codefast/tailwind-variants";
import * as MenubarPrimitive from "@radix-ui/react-menubar";

/* -----------------------------------------------------------------------------
 * Component: Menubar
 * -------------------------------------------------------------------------- */

type MenubarProps = ComponentProps<typeof MenubarPrimitive.Root>;

function Menubar({ className, ...props }: MenubarProps): JSX.Element {
  return (
    <MenubarPrimitive.Root
      className={cn("bg-background flex items-center space-x-1 rounded-lg border p-1", className)}
      data-slot="menubar"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarMenu
 * -------------------------------------------------------------------------- */

type MenubarMenuProps = ComponentProps<typeof MenubarPrimitive.Menu>;

function MenubarMenu({ ...props }: MenubarMenuProps): JSX.Element {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarGroup
 * -------------------------------------------------------------------------- */

type MenubarGroupProps = ComponentProps<typeof MenubarPrimitive.Group>;

function MenubarGroup({ ...props }: MenubarGroupProps): JSX.Element {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSub
 * -------------------------------------------------------------------------- */

type MenubarSubProps = ComponentProps<typeof MenubarPrimitive.Sub>;

function MenubarSub({ ...props }: MenubarSubProps): JSX.Element {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioGroup
 * -------------------------------------------------------------------------- */

type MenubarRadioGroupProps = ComponentProps<typeof MenubarPrimitive.RadioGroup>;

function MenubarRadioGroup({ ...props }: MenubarRadioGroupProps): JSX.Element {
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarTrigger
 * -------------------------------------------------------------------------- */

type MenubarTriggerProps = ComponentProps<typeof MenubarPrimitive.Trigger>;

function MenubarTrigger({ className, ...props }: MenubarTriggerProps): JSX.Element {
  return (
    <MenubarPrimitive.Trigger
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm font-medium outline-hidden select-none",
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

interface MenubarSubTriggerProps extends ComponentProps<typeof MenubarPrimitive.SubTrigger> {
  inset?: boolean;
}

function MenubarSubTrigger({
  children,
  className,
  inset,
  ...props
}: MenubarSubTriggerProps): JSX.Element {
  return (
    <MenubarPrimitive.SubTrigger
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-inset:pl-8",
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

type MenubarSubContentProps = ComponentProps<typeof MenubarPrimitive.SubContent>;

function MenubarSubContent({ className, ...props }: MenubarSubContentProps): JSX.Element {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 ease-ui z-50 min-w-32 rounded-lg border p-1 shadow-lg",
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

type MenubarContentProps = ComponentProps<typeof MenubarPrimitive.Content>;

function MenubarContent({
  align = "start",
  alignOffset = -4,
  className,
  sideOffset = 4,
  ...props
}: MenubarContentProps): JSX.Element {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        align={align}
        alignOffset={alignOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 ease-ui z-50 min-w-32 rounded-lg border p-1 shadow-lg",
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

interface MenubarItemProps extends ComponentProps<typeof MenubarPrimitive.Item> {
  inset?: boolean;
  variant?: "default" | "destructive";
}

function MenubarItem({ className, inset, variant, ...props }: MenubarItemProps): JSX.Element {
  return (
    <MenubarPrimitive.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground group/menubar-item data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive/80 [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-x-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none aria-disabled:opacity-50 data-inset:pl-8 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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

type MenubarCheckboxItemProps = ComponentProps<typeof MenubarPrimitive.CheckboxItem>;

function MenubarCheckboxItem({
  checked,
  children,
  className,
  ...props
}: MenubarCheckboxItemProps): JSX.Element {
  return (
    <MenubarPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground group/menubar-item relative flex cursor-default items-center gap-x-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none aria-disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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

type MenubarRadioItemProps = ComponentProps<typeof MenubarPrimitive.RadioItem>;

function MenubarRadioItem({ children, className, ...props }: MenubarRadioItemProps): JSX.Element {
  return (
    <MenubarPrimitive.RadioItem
      className={cn(
        "focus:bg-accent focus:text-accent-foreground group/menubar-item relative flex cursor-default items-center gap-x-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none aria-disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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

interface MenubarLabelProps extends ComponentProps<typeof MenubarPrimitive.Label> {
  inset?: boolean;
}

function MenubarLabel({ className, inset, ...props }: MenubarLabelProps): JSX.Element {
  return (
    <MenubarPrimitive.Label
      className={cn(
        "flex items-center gap-x-2 px-2 py-1.5 text-sm font-semibold data-inset:pl-8",
        className,
      )}
      data-inset={inset}
      data-slot="menubar-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSeparator
 * -------------------------------------------------------------------------- */

type MenubarSeparatorProps = ComponentProps<typeof MenubarPrimitive.Separator>;

function MenubarSeparator({ className, ...props }: MenubarSeparatorProps): JSX.Element {
  return (
    <MenubarPrimitive.Separator
      className={cn("bg-border mx-2 my-1 h-px", className)}
      data-slot="menubar-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarShortcut
 * -------------------------------------------------------------------------- */

type MenubarShortcutProps = ComponentProps<"span">;

function MenubarShortcut({ className, ...props }: MenubarShortcutProps): JSX.Element {
  return (
    <span
      className={cn(
        "text-muted-foreground group-data-[variant=destructive]/menubar-item:text-destructive/80 ml-auto text-xs tracking-widest",
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

type MenubarArrowProps = ComponentProps<typeof MenubarPrimitive.Arrow>;

function MenubarArrow({ className, ...props }: MenubarArrowProps): JSX.Element {
  return (
    <MenubarPrimitive.Arrow
      className={cn("fill-popover", className)}
      data-slot="menubar-arrow"
      {...props}
    />
  );
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
export type {
  MenubarArrowProps,
  MenubarCheckboxItemProps,
  MenubarContentProps,
  MenubarGroupProps,
  MenubarItemProps,
  MenubarLabelProps,
  MenubarMenuProps,
  MenubarProps,
  MenubarRadioGroupProps,
  MenubarRadioItemProps,
  MenubarSeparatorProps,
  MenubarShortcutProps,
  MenubarSubContentProps,
  MenubarSubProps,
  MenubarSubTriggerProps,
  MenubarTriggerProps,
};
