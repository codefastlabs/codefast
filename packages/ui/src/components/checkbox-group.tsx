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
        'border-input text-primary-foreground shadow-xs outline-hidden peer flex size-4 shrink-0 items-center justify-center rounded-sm border transition',
        'hover:not-disabled:not-aria-checked:border-ring/60',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
        'focus-visible:aria-checked:ring-primary/20 dark:focus-visible:aria-checked:ring-primary/40',
        'aria-checked:border-primary aria-checked:bg-primary aria-checked:shadow-primary/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        'hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60',
        'disabled:opacity-50',
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
