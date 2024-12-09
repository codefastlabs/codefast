import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

type CheckboxCardsElement = ComponentRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxCardsProps = ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Root>;

const CheckboxCards = forwardRef<CheckboxCardsElement, CheckboxCardsProps>(({ className, ...props }, forwardedRef) => (
  <CheckboxGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={forwardedRef} />
));

CheckboxCards.displayName = CheckboxGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

type CheckboxCardsItemElement = ComponentRef<typeof CheckboxGroupPrimitive.Item>;

interface CheckboxCardsItemProps extends ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item> {
  checkboxClassName?: string;
}

const CheckboxCardsItem = forwardRef<CheckboxCardsItemElement, CheckboxCardsItemProps>(
  ({ checkboxClassName, children, className, ...props }, forwardedRef) => (
    <label className={cn('group flex items-center justify-center gap-4 rounded-md border p-4', className)}>
      {children}
      <CheckboxGroupPrimitive.Item
        ref={forwardedRef}
        className={cn(
          'border-input text-primary-foreground peer flex size-4 shrink-0 cursor-pointer rounded border shadow-sm transition',
          'group-hover:border-primary',
          'aria-checked:border-primary aria-checked:bg-primary',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-default disabled:opacity-50',
          checkboxClassName,
        )}
        {...props}
      >
        <CheckboxGroupPrimitive.CheckboxGroupIndicator>
          <CheckIcon className="size-3.5" />
        </CheckboxGroupPrimitive.CheckboxGroupIndicator>
      </CheckboxGroupPrimitive.Item>
    </label>
  ),
);

CheckboxCardsItem.displayName = CheckboxGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxCards, CheckboxCardsItem, type CheckboxCardsItemProps, type CheckboxCardsProps };
