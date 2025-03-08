import type { ComponentProps, JSX } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>): JSX.Element {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} data-slot="radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioGroupItem
 * -------------------------------------------------------------------------- */

function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'border-input hover:not-disabled:not-aria-checked:border-input-hover focus-visible:ring-ring focus-visible:ring-3 aria-checked:border-primary aria-checked:bg-primary not-disabled:shadow-xs peer inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="bg-background size-1 rounded-full" data-slot="radio-group-indicator" />
    </RadioGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioGroup, RadioGroupItem };
