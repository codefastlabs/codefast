import { Slot } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { Separator } from "#/components/separator";
import { cn } from "#/lib/utils";
import type { ItemMediaVariants, ItemVariants } from "#/variants/item";
import { itemMediaVariants, itemVariants } from "#/variants/item";

/* -----------------------------------------------------------------------------
 * Component: ItemGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemGroupProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function ItemGroup({ className, ...props }: ItemGroupProps): JSX.Element {
  return (
    <div
      className={cn(
        "group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2",
        className,
      )}
      data-slot="item-group"
      role="list"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemSeparatorProps = ComponentProps<typeof Separator>;

/**
 * @since 0.3.16-canary.0
 */
function ItemSeparator({ className, ...props }: ItemSeparatorProps): JSX.Element {
  return <Separator className={cn("my-2", className)} data-slot="item-separator" orientation="horizontal" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: Item
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemProps = ComponentProps<"div"> &
  ItemVariants & {
    asChild?: boolean;
  };

/**
 * @since 0.3.16-canary.0
 */
function Item({ asChild = false, className, size = "default", variant = "default", ...props }: ItemProps): JSX.Element {
  const Component = asChild ? Slot.Root : "div";

  return (
    <Component
      className={itemVariants({ className, size, variant })}
      data-size={size}
      data-slot="item"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemMedia
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemMediaProps = ComponentProps<"div"> & ItemMediaVariants;

/**
 * @since 0.3.16-canary.0
 */
function ItemMedia({ className, variant = "default", ...props }: ItemMediaProps): JSX.Element {
  return (
    <div
      className={itemMediaVariants({ className, variant })}
      data-slot="item-media"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemContentProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function ItemContent({ className, ...props }: ItemContentProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none",
        className,
      )}
      data-slot="item-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemTitleProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function ItemTitle({ className, ...props }: ItemTitleProps): JSX.Element {
  return (
    <div
      className={cn(
        "line-clamp-1 flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4",
        className,
      )}
      data-slot="item-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemDescriptionProps = ComponentProps<"p">;

/**
 * @since 0.3.16-canary.0
 */
function ItemDescription({ className, ...props }: ItemDescriptionProps): JSX.Element {
  return (
    <p
      className={cn(
        "line-clamp-2 text-start text-sm leading-normal font-normal text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      data-slot="item-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemActions
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemActionsProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function ItemActions({ className, ...props }: ItemActionsProps): JSX.Element {
  return <div className={cn("flex items-center gap-2", className)} data-slot="item-actions" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ItemHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function ItemHeader({ className, ...props }: ItemHeaderProps): JSX.Element {
  return (
    <div
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      data-slot="item-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function ItemFooter({ className, ...props }: ItemFooterProps): JSX.Element {
  return (
    <div
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      data-slot="item-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
};

export type {
  ItemActionsProps,
  ItemContentProps,
  ItemDescriptionProps,
  ItemFooterProps,
  ItemGroupProps,
  ItemHeaderProps,
  ItemMediaProps,
  ItemProps,
  ItemSeparatorProps,
  ItemTitleProps,
};
