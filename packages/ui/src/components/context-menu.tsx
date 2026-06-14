import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: ContextMenu
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuProps = ComponentProps<typeof ContextMenuPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenu({ ...props }: ContextMenuProps): JSX.Element {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuTriggerProps = ComponentProps<typeof ContextMenuPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuTrigger({ className, ...props }: ContextMenuTriggerProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Trigger
      className={cn("select-none", className)}
      data-slot="context-menu-trigger"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuGroupProps = ComponentProps<typeof ContextMenuPrimitive.Group>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuGroup({ ...props }: ContextMenuGroupProps): JSX.Element {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSub
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuSubProps = ComponentProps<typeof ContextMenuPrimitive.Sub>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuSub({ ...props }: ContextMenuSubProps): JSX.Element {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuRadioGroupProps = ComponentProps<typeof ContextMenuPrimitive.RadioGroup>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuRadioGroup({ ...props }: ContextMenuRadioGroupProps): JSX.Element {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface ContextMenuSubTriggerProps extends ComponentProps<typeof ContextMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuSubTrigger({ children, className, inset, ...props }: ContextMenuSubTriggerProps): JSX.Element {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-8 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="context-menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto rtl:rotate-180" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSubContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuSubContentProps = ComponentProps<typeof ContextMenuPrimitive.SubContent>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps): JSX.Element {
  return (
    <ContextMenuPrimitive.SubContent
      className={cn(
        "z-50 min-w-32 origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg ease-snappy data-open:animate-in data-open:animation-duration-menu-in data-open:fade-in-0 data-open:zoom-in-95 data-open:data-side-top:slide-in-from-bottom-2 data-open:data-side-right:slide-in-from-left-2 data-open:data-side-bottom:slide-in-from-top-2 data-open:data-side-left:slide-in-from-right-2 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-menu-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:data-side-top:slide-out-to-bottom-2 data-closed:data-side-right:slide-out-to-left-2 data-closed:data-side-bottom:slide-out-to-top-2 data-closed:data-side-left:slide-out-to-right-2",
        className,
      )}
      data-slot="context-menu-sub-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuContentProps = ComponentProps<typeof ContextMenuPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuContent({ className, ...props }: ContextMenuContentProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal">
      <ContextMenuPrimitive.Content
        className={cn(
          "z-50 max-h-(--radix-context-menu-content-available-height) min-w-36 origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 ease-snappy data-open:animate-in data-open:animation-duration-menu-in data-open:fade-in-0 data-open:zoom-in-95 data-open:data-side-top:slide-in-from-bottom-2 data-open:data-side-right:slide-in-from-left-2 data-open:data-side-bottom:slide-in-from-top-2 data-open:data-side-left:slide-in-from-right-2 data-closed:ease-exit",
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

/**
 * @since 0.3.16-canary.0
 */
interface ContextMenuItemProps extends ComponentProps<typeof ContextMenuPrimitive.Item> {
  inset?: boolean;
  variant?: "default" | "destructive";
}

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuItem({ className, inset, variant = "default", ...props }: ContextMenuItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "group/context-menu-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive",
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

/**
 * @since 0.3.16-canary.0
 */
interface ContextMenuCheckboxItemProps extends ComponentProps<typeof ContextMenuPrimitive.CheckboxItem> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuCheckboxItem({
  checked,
  children,
  className,
  inset,
  ...props
}: ContextMenuCheckboxItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="context-menu-checkbox-item"
      {...props}
    >
      <span className="pointer-events-none absolute end-2">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuRadioItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface ContextMenuRadioItemProps extends ComponentProps<typeof ContextMenuPrimitive.RadioItem> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuRadioItem({ children, className, inset, ...props }: ContextMenuRadioItemProps): JSX.Element {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="context-menu-radio-item"
      {...props}
    >
      <span className="pointer-events-none absolute end-2">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuLabel
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface ContextMenuLabelProps extends ComponentProps<typeof ContextMenuPrimitive.Label> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuLabel({ className, inset, ...props }: ContextMenuLabelProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Label
      className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground data-inset:ps-8", className)}
      data-inset={inset}
      data-slot="context-menu-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuSeparatorProps = ComponentProps<typeof ContextMenuPrimitive.Separator>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      data-slot="context-menu-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ContextMenuShortcut
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuShortcutProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuShortcut({ className, ...props }: ContextMenuShortcutProps): JSX.Element {
  return (
    <span
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-focus/context-menu-item:text-accent-foreground",
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

/**
 * @since 0.3.16-canary.0
 */
type ContextMenuArrowProps = ComponentProps<typeof ContextMenuPrimitive.Arrow>;

/**
 * @since 0.3.16-canary.0
 */
function ContextMenuArrow({ className, ...props }: ContextMenuArrowProps): JSX.Element {
  return (
    <ContextMenuPrimitive.Arrow className={cn("fill-popover", className)} data-slot="context-menu-arrow" {...props} />
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
