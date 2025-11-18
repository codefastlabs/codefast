import type { ComponentProps, JSX } from 'react';

import type { VariantProps } from '@codefast/tailwind-variants';

import { cn, tv } from '@codefast/tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variants: Empty
 * -------------------------------------------------------------------------- */

const emptyMediaVariants = tv({
  base: 'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-transparent',
      icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg:not([class*='size-'])]:size-6",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: Empty
 * -------------------------------------------------------------------------- */

type EmptyProps = ComponentProps<'div'>;

function Empty({ className, ...props }: EmptyProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-xl border-dashed p-6 text-center text-balance md:p-12',
        className,
      )}
      data-slot="empty"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyHeader
 * -------------------------------------------------------------------------- */

type EmptyHeaderProps = ComponentProps<'div'>;

function EmptyHeader({ className, ...props }: EmptyHeaderProps): JSX.Element {
  return (
    <div
      className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)}
      data-slot="empty-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyMedia
 * -------------------------------------------------------------------------- */

type EmptyMediaProps = ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>;

function EmptyMedia({ className, variant = 'default', ...props }: EmptyMediaProps): JSX.Element {
  return (
    <div
      className={emptyMediaVariants({ className, variant })}
      data-slot="empty-icon"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyTitle
 * -------------------------------------------------------------------------- */

type EmptyTitleProps = ComponentProps<'div'>;

function EmptyTitle({ className, ...props }: EmptyTitleProps): JSX.Element {
  return <div className={cn('text-lg font-medium tracking-tight', className)} data-slot="empty-title" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: EmptyDescription
 * -------------------------------------------------------------------------- */

type EmptyDescriptionProps = ComponentProps<'p'>;

function EmptyDescription({ className, ...props }: EmptyDescriptionProps): JSX.Element {
  return (
    <p
      className={cn(
        'text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      data-slot="empty-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyContent
 * -------------------------------------------------------------------------- */

type EmptyContentProps = ComponentProps<'div'>;

function EmptyContent({ className, ...props }: EmptyContentProps): JSX.Element {
  return (
    <div
      className={cn('flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance', className)}
      data-slot="empty-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, emptyMediaVariants, EmptyTitle };

export type {
  EmptyContentProps,
  EmptyDescriptionProps,
  EmptyHeaderProps,
  EmptyMediaProps,
  EmptyProps,
  EmptyTitleProps,
};
