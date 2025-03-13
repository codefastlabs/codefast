import type { ComponentProps, JSX } from 'react';

import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

function CheckboxGroup({ className, ...props }: ComponentProps<typeof CheckboxGroupPrimitive.Root>): JSX.Element {
  return <CheckboxGroupPrimitive.Root className={cn('grid gap-2', className)} data-slot="checkbox-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

function CheckboxGroupItem({ className, ...props }: ComponentProps<typeof CheckboxGroupPrimitive.Item>): JSX.Element {
  return (
    <CheckboxGroupPrimitive.Item
      className={cn(
        'border-input text-primary-foreground hover:not-disabled:not-aria-checked:border-input-hover aria-checked:border-primary aria-checked:bg-primary focus-visible:border-input-focus aria-checked:focus-visible:ring-primary/20 focus-visible:ring-ring focus-visible:ring-3 not-disabled:shadow-xs outline-hidden peer inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition disabled:opacity-50',
        className,
      )}
      data-slot="checkbox-group-item"
      {...props}
    >
      <CheckboxGroupPrimitive.CheckboxGroupIndicator
        className="flex items-center justify-center text-current transition-none"
        data-slot="checkbox-group-indicator"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxGroupPrimitive.CheckboxGroupIndicator>
    </CheckboxGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxGroup, CheckboxGroupItem };
