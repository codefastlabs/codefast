import type { ComponentProps, JSX } from 'react';

import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

type CheckboxGroupProps = ComponentProps<typeof CheckboxGroupPrimitive.Root>;

function CheckboxGroup({ className, ...props }: CheckboxGroupProps): JSX.Element {
  return <CheckboxGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

type CheckboxGroupItemProps = ComponentProps<typeof CheckboxGroupPrimitive.Item>;

function CheckboxGroupItem({ className, ...props }: CheckboxGroupItemProps): JSX.Element {
  return (
    <CheckboxGroupPrimitive.Item
      className={cn(
        [
          'border-input text-primary-foreground shadow-xs peer flex size-4 shrink-0 rounded-sm border transition',
          'hover:not-disabled:not-aria-checked:border-input-hover',
          'aria-checked:border-primary aria-checked:bg-primary',
          'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none',
          'disabled:opacity-50',
        ],
        className,
      )}
      {...props}
    >
      <CheckboxGroupPrimitive.CheckboxGroupIndicator>
        <CheckIcon className="size-3.5" />
      </CheckboxGroupPrimitive.CheckboxGroupIndicator>
    </CheckboxGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CheckboxGroupItemProps, CheckboxGroupProps };
export { CheckboxGroup, CheckboxGroupItem };
