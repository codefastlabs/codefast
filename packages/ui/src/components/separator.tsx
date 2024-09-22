'use client';

import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

const separatorVariants = tv({
  base: 'bg-border relative flex shrink-0 items-center',
  variants: {
    align: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px flex-col',
    },
  },
  defaultVariants: {
    align: 'center',
    orientation: 'horizontal',
  },
});

type SeparatorVariantsProps = VariantProps<typeof separatorVariants>;

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

type SeparatorElement = React.ElementRef<typeof SeparatorPrimitive.Root>;

interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    Omit<SeparatorVariantsProps, 'orientation'> {}

const Separator = React.forwardRef<SeparatorElement, SeparatorProps>(
  ({ className, orientation, align, decorative = true, ...props }, forwardedRef) => (
    <SeparatorPrimitive.Root
      ref={forwardedRef}
      className={separatorVariants({ align, orientation, className })}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  ),
);

Separator.displayName = SeparatorPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: SeparatorItem
 * -------------------------------------------------------------------------- */

type SeparatorItemElement = HTMLDivElement;
type SeparatorItemProps = React.HTMLAttributes<HTMLDivElement>;

const SeparatorItem = React.forwardRef<SeparatorItemElement, SeparatorItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cn('bg-background text-muted-foreground absolute mx-2 px-2 text-sm', className)}
      {...props}
    />
  ),
);

SeparatorItem.displayName = 'SeparatorItem';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Separator, SeparatorItem, type SeparatorProps };
