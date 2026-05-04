import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn, tv } from "#/lib/utils";
import { Slot } from "@radix-ui/react-slot";

import { Separator } from "#/components/separator";

/* -----------------------------------------------------------------------------
 * Variants: Item
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const itemVariants = tv({
  base: [
    "group/item flex flex-wrap items-center",
    "rounded-lg border border-transparent outline-hidden",
    "text-sm",
    "transition-colors duration-100",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "[a]:transition-colors",
    "[a]:hover:bg-accent/50",
  ],
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: ["gap-4", "p-4"],
      sm: ["gap-2.5", "px-4 py-3"],
    },
    variant: {
      default: "bg-transparent",
      muted: "bg-muted/50",
      outline: "border-border",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
const itemMediaVariants = tv({
  base: [
    "flex shrink-0 items-center justify-center gap-2",
    "group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start",
    "[&_svg]:pointer-events-none",
  ],
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-transparent",
      icon: [
        "size-8 shrink-0",
        "rounded-md border",
        "bg-muted",
        "[&_svg:not([class*='size-'])]:size-4",
      ],
      image: [
        "size-10 shrink-0 overflow-hidden",
        "rounded-md",
        "[&_img]:size-full [&_img]:object-cover",
      ],
    },
  },
});

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
      className={cn("group/item-group flex flex-col", className)}
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
  return (
    <Separator
      className={cn("my-0", className)}
      data-slot="item-separator"
      orientation="horizontal"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: Item
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ItemProps = ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & {
    asChild?: boolean;
  };

/**
 * @since 0.3.16-canary.0
 */
function Item({
  asChild = false,
  className,
  size = "default",
  variant = "default",
  ...props
}: ItemProps): JSX.Element {
  const Component = asChild ? Slot : "div";

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
type ItemMediaProps = ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>;

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
        "flex flex-1 flex-col gap-1",
        "[&+[data-slot=item-content]]:flex-none",
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
      className={cn("flex w-fit items-center gap-2", "text-sm leading-snug font-medium", className)}
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
        "line-clamp-2 text-sm leading-normal font-normal text-balance text-muted-foreground",
        "[&>a]:underline [&>a]:underline-offset-4",
        "[&>a:hover]:text-primary",
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
  return (
    <div className={cn("flex items-center gap-2", className)} data-slot="item-actions" {...props} />
  );
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
  itemMediaVariants,
  ItemSeparator,
  ItemTitle,
  itemVariants,
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
