import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { tv } from 'tailwind-variants';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

const separatorVariants = tv({
  base: 'bg-muted relative flex shrink-0 items-center',
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
  defaultVariants: {
    align: 'center',
    orientation: 'horizontal',
  },
});

type SeparatorVariantsProps = VariantProps<typeof separatorVariants>;

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

interface SeparatorProps
  extends ComponentProps<typeof SeparatorPrimitive.Root>,
    Omit<SeparatorVariantsProps, 'orientation'> {}

function Separator({ align, className, decorative = true, orientation, ...props }: SeparatorProps): JSX.Element {
  return (
    <SeparatorPrimitive.Root
      className={separatorVariants({ align, className, orientation })}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SeparatorItem
 * -------------------------------------------------------------------------- */

type SeparatorItemProps = ComponentProps<'div'>;

function SeparatorItem({ className, ...props }: SeparatorItemProps): JSX.Element {
  return <div className={cn('bg-background text-muted-foreground absolute mx-2 px-2 text-sm', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { SeparatorProps };
export { Separator, SeparatorItem };
