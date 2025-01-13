import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

type CheckboxGroupElement = ComponentRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxGroupProps = ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Root>;

const CheckboxGroup = forwardRef<CheckboxGroupElement, CheckboxGroupProps>(
  ({ className, ...props }, forwardedRef) => (
    <CheckboxGroupPrimitive.Root
      ref={forwardedRef}
      className={cn('grid gap-2', className)}
      {...props}
    />
  ),
);

CheckboxGroup.displayName = 'CheckboxGroup';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

type CheckboxGroupItemElement = ComponentRef<typeof CheckboxGroupPrimitive.Item>;
type CheckboxGroupItemProps = ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item>;

const CheckboxGroupItem = forwardRef<CheckboxGroupItemElement, CheckboxGroupItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <CheckboxGroupPrimitive.Item
      ref={forwardedRef}
      className={cn(
        [
          'border-input text-primary-foreground shadow-xs peer flex size-4 shrink-0 rounded-sm border transition',
          'hover:border-primary',
          'aria-checked:border-primary aria-checked:bg-primary',
          'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        ],
        className,
      )}
      {...props}
    >
      <CheckboxGroupPrimitive.CheckboxGroupIndicator>
        <CheckIcon className="size-3.5" />
      </CheckboxGroupPrimitive.CheckboxGroupIndicator>
    </CheckboxGroupPrimitive.Item>
  ),
);

CheckboxGroupItem.displayName = 'CheckboxGroupItem';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CheckboxGroupItemProps, CheckboxGroupProps };
export { CheckboxGroup, CheckboxGroupItem };
