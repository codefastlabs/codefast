import type { ComponentProps, JSX } from 'react';

import type { VariantProps } from '@codefast/tailwind-variants';

import { Separator } from '@/components/separator';
import { cn, tv } from '@codefast/tailwind-variants';
import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Variants: Item
 * -------------------------------------------------------------------------- */

const itemVariants = tv({
  base: cn(
    'group/item flex flex-wrap items-center rounded-lg border border-transparent text-sm transition-colors duration-100 outline-hidden',
    '[a]:transition-colors [a]:hover:bg-accent/50',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
  ),
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
  variants: {
    size: {
      default: 'gap-4 p-4',
      sm: 'gap-2.5 px-4 py-3',
    },
    variant: {
      default: 'bg-transparent',
      muted: 'bg-muted/50',
      outline: 'border-border',
    },
  },
});

const itemMediaVariants = tv({
  base: cn(
    'group-has-[[data-slot=item-description]]/item:self-start flex shrink-0 items-center justify-center gap-2',
    '[&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5',
  ),
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-transparent',
      icon: "size-8 shrink-0 rounded-md border bg-muted [&_svg:not([class*='size-'])]:size-4",
      image: 'size-10 shrink-0 overflow-hidden rounded-md [&_img]:size-full [&_img]:object-cover',
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: ItemGroup
 * -------------------------------------------------------------------------- */

type ItemGroupProps = ComponentProps<'div'>;

function ItemGroup({ className, ...props }: ItemGroupProps): JSX.Element {
  return (
    <div className={cn('group/item-group flex flex-col', className)} data-slot="item-group" role="list" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemSeparator
 * -------------------------------------------------------------------------- */

type ItemSeparatorProps = ComponentProps<typeof Separator>;

function ItemSeparator({ className, ...props }: ItemSeparatorProps): JSX.Element {
  return <Separator className={cn('my-0', className)} data-slot="item-separator" orientation="horizontal" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: Item
 * -------------------------------------------------------------------------- */

type ItemProps = ComponentProps<'div'> &
  VariantProps<typeof itemVariants> & {
    asChild?: boolean;
  };

function Item({ asChild = false, className, size = 'default', variant = 'default', ...props }: ItemProps): JSX.Element {
  const Component = asChild ? Slot : 'div';

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

type ItemMediaProps = ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>;

function ItemMedia({ className, variant = 'default', ...props }: ItemMediaProps): JSX.Element {
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

type ItemContentProps = ComponentProps<'div'>;

function ItemContent({ className, ...props }: ItemContentProps): JSX.Element {
  return (
    <div
      className={cn('flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none', className)}
      data-slot="item-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemTitle
 * -------------------------------------------------------------------------- */

type ItemTitleProps = ComponentProps<'div'>;

function ItemTitle({ className, ...props }: ItemTitleProps): JSX.Element {
  return (
    <div
      className={cn('flex w-fit items-center gap-2 text-sm leading-snug font-medium', className)}
      data-slot="item-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemDescription
 * -------------------------------------------------------------------------- */

type ItemDescriptionProps = ComponentProps<'p'>;

function ItemDescription({ className, ...props }: ItemDescriptionProps): JSX.Element {
  return (
    <p
      className={cn(
        'text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
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

type ItemActionsProps = ComponentProps<'div'>;

function ItemActions({ className, ...props }: ItemActionsProps): JSX.Element {
  return <div className={cn('flex items-center gap-2', className)} data-slot="item-actions" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ItemHeader
 * -------------------------------------------------------------------------- */

type ItemHeaderProps = ComponentProps<'div'>;

function ItemHeader({ className, ...props }: ItemHeaderProps): JSX.Element {
  return (
    <div
      className={cn('flex basis-full items-center justify-between gap-2', className)}
      data-slot="item-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ItemFooter
 * -------------------------------------------------------------------------- */

type ItemFooterProps = ComponentProps<'div'>;

function ItemFooter({ className, ...props }: ItemFooterProps): JSX.Element {
  return (
    <div
      className={cn('flex basis-full items-center justify-between gap-2', className)}
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
