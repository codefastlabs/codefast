import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { Menubar as MenubarPrimitive } from "radix-ui";
import { CheckIcon, ChevronRightIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: Menubar
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarProps = ComponentProps<typeof MenubarPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Menubar({ className, ...props }: MenubarProps): JSX.Element {
  return (
    <MenubarPrimitive.Root
      className={cn("flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs", className)}
      data-slot="menubar"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarMenu
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarMenuProps = ComponentProps<typeof MenubarPrimitive.Menu>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarMenu({ ...props }: MenubarMenuProps): JSX.Element {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarGroupProps = ComponentProps<typeof MenubarPrimitive.Group>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarGroup({ ...props }: MenubarGroupProps): JSX.Element {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarPortal
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarPortalProps = ComponentProps<typeof MenubarPrimitive.Portal>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarPortal({ ...props }: MenubarPortalProps): JSX.Element {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSub
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarSubProps = ComponentProps<typeof MenubarPrimitive.Sub>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarSub({ ...props }: MenubarSubProps): JSX.Element {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarRadioGroupProps = ComponentProps<typeof MenubarPrimitive.RadioGroup>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarRadioGroup({ ...props }: MenubarRadioGroupProps): JSX.Element {
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MenubarTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarTriggerProps = ComponentProps<typeof MenubarPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarTrigger({ className, ...props }: MenubarTriggerProps): JSX.Element {
  return (
    <MenubarPrimitive.Trigger
      className={cn(
        "flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none hover:bg-muted aria-expanded:bg-muted",
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

/**
 * @since 0.3.16-canary.0
 */
interface MenubarSubTriggerProps extends ComponentProps<typeof MenubarPrimitive.SubTrigger> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function MenubarSubTrigger({
  children,
  className,
  inset,
  ...props
}: MenubarSubTriggerProps): JSX.Element {
  return (
    <MenubarPrimitive.SubTrigger
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-inset:pl-8 data-open:bg-accent data-open:text-accent-foreground [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="menubar-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4 cf-rtl-flip" />
    </MenubarPrimitive.SubTrigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSubContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarSubContentProps = ComponentProps<typeof MenubarPrimitive.SubContent>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarSubContent({ className, ...props }: MenubarSubContentProps): JSX.Element {
  return (
    <MenubarPrimitive.SubContent
      className={cn(
        "cf-menu-target cf-menu-translucent z-50 min-w-32 origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className,
      )}
      data-slot="menubar-sub-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarContentProps = ComponentProps<typeof MenubarPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarContent({
  align = "start",
  alignOffset = -4,
  className,
  sideOffset = 8,
  ...props
}: MenubarContentProps): JSX.Element {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        align={align}
        alignOffset={alignOffset}
        className={cn(
          "cf-menu-target cf-menu-translucent z-50 min-w-36 origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          className,
        )}
        data-slot="menubar-content"
        sideOffset={sideOffset}
        {...props}
      />
    </MenubarPortal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface MenubarItemProps extends ComponentProps<typeof MenubarPrimitive.Item> {
  inset?: boolean;
  variant?: "default" | "destructive";
}

/**
 * @since 0.3.16-canary.0
 */
function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenubarItemProps): JSX.Element {
  return (
    <MenubarPrimitive.Item
      className={cn(
        "group/menubar-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive!",
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

/**
 * @since 0.3.16-canary.0
 */
interface MenubarCheckboxItemProps extends ComponentProps<typeof MenubarPrimitive.CheckboxItem> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function MenubarCheckboxItem({
  checked,
  children,
  className,
  inset,
  ...props
}: MenubarCheckboxItemProps): JSX.Element {
  return (
    <MenubarPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-8 data-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-inset={inset}
      data-slot="menubar-checkbox-item"
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarRadioItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface MenubarRadioItemProps extends ComponentProps<typeof MenubarPrimitive.RadioItem> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function MenubarRadioItem({
  children,
  className,
  inset,
  ...props
}: MenubarRadioItemProps): JSX.Element {
  return (
    <MenubarPrimitive.RadioItem
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="menubar-radio-item"
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarLabel
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface MenubarLabelProps extends ComponentProps<typeof MenubarPrimitive.Label> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function MenubarLabel({ className, inset, ...props }: MenubarLabelProps): JSX.Element {
  return (
    <MenubarPrimitive.Label
      className={cn("px-2 py-1.5 text-sm font-medium data-inset:pl-8", className)}
      data-inset={inset}
      data-slot="menubar-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarSeparatorProps = ComponentProps<typeof MenubarPrimitive.Separator>;

/**
 * @since 0.3.16-canary.0
 */
function MenubarSeparator({ className, ...props }: MenubarSeparatorProps): JSX.Element {
  return (
    <MenubarPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      data-slot="menubar-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MenubarShortcut
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type MenubarShortcutProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function MenubarShortcut({ className, ...props }: MenubarShortcutProps): JSX.Element {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/menubar-item:text-accent-foreground",
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

/**
 * @since 0.3.16-canary.0
 */
type MenubarArrowProps = ComponentProps<typeof MenubarPrimitive.Arrow>;

/**
 * @since 0.3.16-canary.0
 */
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
  MenubarPortal,
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
  MenubarPortalProps,
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
