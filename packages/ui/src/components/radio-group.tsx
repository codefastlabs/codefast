import type { ComponentProps, JSX } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

type RadioGroupProps = ComponentProps<typeof RadioGroupPrimitive.Root>;

function RadioGroup({ className, ...props }: RadioGroupProps): JSX.Element {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioGroupItem
 * -------------------------------------------------------------------------- */

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

function RadioGroupItem({ className, ...props }: RadioGroupItemProps): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'peer',
        'border-input inline-flex size-4 shrink-0 items-center justify-center rounded-full border shadow-sm transition',
        'hover:not-disabled:not-aria-checked:border-input-hover',
        'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none',
        'aria-checked:border-primary aria-checked:bg-primary',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="bg-background size-1 rounded-full" />
    </RadioGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { RadioGroupItemProps, RadioGroupProps };
export { RadioGroup, RadioGroupItem };
