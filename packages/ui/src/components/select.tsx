import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Select
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectProps = ComponentProps<typeof SelectPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Select({ ...props }: SelectProps): JSX.Element {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectGroupProps = ComponentProps<typeof SelectPrimitive.Group>;

/**
 * @since 0.3.16-canary.0
 */
function SelectGroup({ className, ...props }: SelectGroupProps): JSX.Element {
  return <SelectPrimitive.Group className={cn("scroll-my-1 p-1", className)} data-slot="select-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectValue
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectValueProps = ComponentProps<typeof SelectPrimitive.Value>;

/**
 * @since 0.3.16-canary.0
 */
function SelectValue({ ...props }: SelectValueProps): JSX.Element {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SelectTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SelectTriggerProps extends ComponentProps<typeof SelectPrimitive.Trigger> {
  size?: "default" | "sm";
}

/**
 * @since 0.3.16-canary.0
 */
function SelectTrigger({ children, className, size = "default", ...props }: SelectTriggerProps): JSX.Element {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 ps-2.5 pe-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-size={size}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollUpButton
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectScrollUpButtonProps = ComponentProps<typeof SelectPrimitive.ScrollUpButton>;

/**
 * @since 0.3.16-canary.0
 */
function SelectScrollUpButton({ className, ...props }: SelectScrollUpButtonProps): JSX.Element {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="select-scroll-up-button"
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectScrollDownButton
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectScrollDownButtonProps = ComponentProps<typeof SelectPrimitive.ScrollDownButton>;

/**
 * @since 0.3.16-canary.0
 */
function SelectScrollDownButton({ className, ...props }: SelectScrollDownButtonProps): JSX.Element {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="select-scroll-down-button"
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectContentProps = ComponentProps<typeof SelectPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function SelectContent({
  align = "center",
  children,
  className,
  position = "item-aligned",
  ...props
}: SelectContentProps): JSX.Element {
  return (
    <SelectPrimitive.Portal data-slot="select-portal">
      <SelectPrimitive.Content
        align={align}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 ease-snappy data-[align-trigger=true]:animate-none data-open:animate-in data-open:animation-duration-menu-in data-open:fade-in-0 data-open:zoom-in-95 data-open:data-side-top:slide-in-from-bottom-2 data-open:data-side-right:slide-in-from-left-2 data-open:data-side-bottom:slide-in-from-top-2 data-open:data-side-left:slide-in-from-right-2 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-menu-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:data-side-top:slide-out-to-bottom-2 data-closed:data-side-right:slide-out-to-left-2 data-closed:data-side-bottom:slide-out-to-top-2 data-closed:data-side-left:slide-out-to-right-2",
          position === "popper" &&
            "data-side-top:-translate-y-1 data-side-right:translate-x-1 data-side-bottom:translate-y-1 data-side-left:-translate-x-1",
          className,
        )}
        data-align-trigger={position === "item-aligned"}
        data-slot="select-content"
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
            position === "popper" && "",
          )}
          data-position={position}
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

/**
 * @since 0.3.16-canary.0
 */
type SelectLabelProps = ComponentProps<typeof SelectPrimitive.Label>;

/**
 * @since 0.3.16-canary.0
 */
function SelectLabel({ className, ...props }: SelectLabelProps): JSX.Element {
  return (
    <SelectPrimitive.Label
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item>;

/**
 * @since 0.3.16-canary.0
 */
function SelectItem({ children, className, ...props }: SelectItemProps): JSX.Element {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      data-slot="select-item"
      {...props}
    >
      <span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SelectSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SelectSeparatorProps = ComponentProps<typeof SelectPrimitive.Separator>;

/**
 * @since 0.3.16-canary.0
 */
function SelectSeparator({ className, ...props }: SelectSeparatorProps): JSX.Element {
  return (
    <SelectPrimitive.Separator
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
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

export type {
  SelectContentProps,
  SelectGroupProps,
  SelectItemProps,
  SelectLabelProps,
  SelectProps,
  SelectScrollDownButtonProps,
  SelectScrollUpButtonProps,
  SelectSeparatorProps,
  SelectTriggerProps,
  SelectValueProps,
};
