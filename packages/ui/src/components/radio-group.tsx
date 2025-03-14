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
        'border-input focus-visible:aria-checked:ring-primary/20 focus-visible:ring-ring/20 focus-visible:ring-3 aria-checked:border-primary aria-checked:bg-primary not-disabled:shadow-xs outline-hidden focus-visible:border-ring hover:not-disabled:not-aria-checked:border-ring/60 hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20 aria-invalid:border-destructive peer inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-50',
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
