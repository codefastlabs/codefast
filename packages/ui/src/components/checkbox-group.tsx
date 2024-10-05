import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

type CheckboxGroupElement = React.ComponentRef<
  typeof CheckboxGroupPrimitive.Root
>;
type CheckboxGroupProps = React.ComponentPropsWithoutRef<
  typeof CheckboxGroupPrimitive.Root
>;

const CheckboxGroup = React.forwardRef<
  CheckboxGroupElement,
  CheckboxGroupProps
>(({ className, ...props }, forwardedRef) => (
  <CheckboxGroupPrimitive.Root
    ref={forwardedRef}
    className={cn('grid gap-2', className)}
    {...props}
  />
));

CheckboxGroup.displayName = 'CheckboxGroup';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

type CheckboxGroupItemElement = React.ComponentRef<
  typeof CheckboxGroupPrimitive.Item
>;
type CheckboxGroupItemProps = React.ComponentPropsWithoutRef<
  typeof CheckboxGroupPrimitive.Item
>;

const CheckboxGroupItem = React.forwardRef<
  CheckboxGroupItemElement,
  CheckboxGroupItemProps
>(({ className, ...props }, forwardedRef) => (
  <CheckboxGroupPrimitive.Item
    ref={forwardedRef}
    className={cn(
      [
        'border-input peer flex size-4 shrink-0 rounded-sm border shadow-sm',
        'hover:border-primary',
        'aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground',
        'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
      ],
      className,
    )}
    {...props}
  >
    <CheckboxGroupPrimitive.CheckboxGroupIndicator className="flex size-full items-center justify-center text-current">
      <CheckIcon className="size-3.5" />
    </CheckboxGroupPrimitive.CheckboxGroupIndicator>
  </CheckboxGroupPrimitive.Item>
));

CheckboxGroupItem.displayName = 'CheckboxGroupItem';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  CheckboxGroup,
  CheckboxGroupItem,
  type CheckboxGroupProps,
  type CheckboxGroupItemProps,
};
