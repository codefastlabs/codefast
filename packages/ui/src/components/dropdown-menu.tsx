import { CheckIcon, ChevronRightIcon } from "lucide-react";
import * as DropdownMenuPrimitive from "radix-ui/dropdown-menu";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: DropdownMenu
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuProps = ComponentProps<typeof DropdownMenuPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenu({ ...props }: DropdownMenuProps): JSX.Element {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuTriggerProps = ComponentProps<typeof DropdownMenuPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuTrigger({ ...props }: DropdownMenuTriggerProps): JSX.Element {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuGroupProps = ComponentProps<typeof DropdownMenuPrimitive.Group>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuGroup({ ...props }: DropdownMenuGroupProps): JSX.Element {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSub
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuSubProps = ComponentProps<typeof DropdownMenuPrimitive.Sub>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuSub({ ...props }: DropdownMenuSubProps): JSX.Element {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuRadioGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuRadioGroupProps = ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuRadioGroup({ ...props }: DropdownMenuRadioGroupProps): JSX.Element {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DropdownMenuSubTriggerProps extends ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuSubTrigger({ children, className, inset, ...props }: DropdownMenuSubTriggerProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:ps-7 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto rtl:rotate-180" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSubContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuSubContentProps = ComponentProps<typeof DropdownMenuPrimitive.SubContent>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuSubContent({ className, ...props }: DropdownMenuSubContentProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal">
      <DropdownMenuPrimitive.SubContent
        className={cn(
          "z-50 min-w-24 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 ease-snappy data-open:animate-in data-open:animation-duration-menu-in data-open:fade-in-0 data-open:zoom-in-95 data-open:data-side-top:slide-in-from-bottom-2 data-open:data-side-right:slide-in-from-left-2 data-open:data-side-bottom:slide-in-from-top-2 data-open:data-side-left:slide-in-from-right-2 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-menu-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:data-side-top:slide-out-to-bottom-2 data-closed:data-side-right:slide-out-to-left-2 data-closed:data-side-bottom:slide-out-to-top-2 data-closed:data-side-left:slide-out-to-right-2",
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

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuContentProps = ComponentProps<typeof DropdownMenuPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuContent({
  align = "start",
  className,
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal">
      <DropdownMenuPrimitive.Content
        align={align}
        className={cn(
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 ease-snappy data-open:animate-in data-open:animation-duration-menu-in data-open:fade-in-0 data-open:zoom-in-95 data-open:data-side-top:slide-in-from-bottom-2 data-open:data-side-right:slide-in-from-left-2 data-open:data-side-bottom:slide-in-from-top-2 data-open:data-side-left:slide-in-from-right-2 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-menu-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:data-side-top:slide-out-to-bottom-2 data-closed:data-side-right:slide-out-to-left-2 data-closed:data-side-bottom:slide-out-to-top-2 data-closed:data-side-left:slide-out-to-right-2",
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

/**
 * @since 0.3.16-canary.0
 */
interface DropdownMenuItemProps extends ComponentProps<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
  variant?: "default" | "destructive";
}

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuItem({ className, inset, variant = "default", ...props }: DropdownMenuItemProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:ps-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
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

/**
 * @since 0.3.16-canary.0
 */
interface DropdownMenuCheckboxItemProps extends ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuCheckboxItem({
  checked,
  children,
  className,
  inset,
  ...props
}: DropdownMenuCheckboxItemProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 ps-1.5 pe-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:ps-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-checkbox-item"
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-e-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuRadioItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DropdownMenuRadioItemProps extends ComponentProps<typeof DropdownMenuPrimitive.RadioItem> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuRadioItem({ children, className, inset, ...props }: DropdownMenuRadioItemProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 ps-1.5 pe-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:ps-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-radio-item"
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-e-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuLabel
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DropdownMenuLabelProps extends ComponentProps<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:ps-7", className)}
      data-inset={inset}
      data-slot="dropdown-menu-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuSeparatorProps = ComponentProps<typeof DropdownMenuPrimitive.Separator>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      data-slot="dropdown-menu-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DropdownMenuShortcut
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuShortcutProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps): JSX.Element {
  return (
    <span
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
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

/**
 * @since 0.3.16-canary.0
 */
type DropdownMenuArrowProps = ComponentProps<typeof DropdownMenuPrimitive.Arrow>;

/**
 * @since 0.3.16-canary.0
 */
function DropdownMenuArrow({ className, ...props }: DropdownMenuArrowProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Arrow className={cn("fill-popover", className)} data-slot="dropdown-menu-arrow" {...props} />
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
