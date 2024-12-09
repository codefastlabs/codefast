import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

const separatorVariants = tv({
  base: 'bg-muted relative flex shrink-0 items-center',
  defaultVariants: {
    align: 'center',
    orientation: 'horizontal',
  },
  variants: {
    align: {
      center: 'justify-center',
      end: 'justify-end',
      start: 'justify-start',
    },
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px flex-col',
    },
  },
});

type SeparatorVariantsProps = VariantProps<typeof separatorVariants>;

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

type SeparatorElement = ComponentRef<typeof SeparatorPrimitive.Root>;
interface SeparatorProps
  extends ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    Omit<SeparatorVariantsProps, 'orientation'> {}

const Separator = forwardRef<SeparatorElement, SeparatorProps>(
  ({ align, className, decorative = true, orientation, ...props }, forwardedRef) => (
    <SeparatorPrimitive.Root
      ref={forwardedRef}
      className={separatorVariants({ align, className, orientation })}
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
type SeparatorItemProps = HTMLAttributes<HTMLDivElement>;

const SeparatorItem = forwardRef<SeparatorItemElement, SeparatorItemProps>(({ className, ...props }, forwardedRef) => (
  <div
    ref={forwardedRef}
    className={cn('bg-background text-muted-foreground absolute mx-2 px-2 text-sm', className)}
    {...props}
  />
));

SeparatorItem.displayName = 'SeparatorItem';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Separator, SeparatorItem, type SeparatorProps };
