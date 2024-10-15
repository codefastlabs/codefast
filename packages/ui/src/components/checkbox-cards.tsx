import { cn } from '@/lib/utils';
import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from '@radix-ui/react-icons';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

type CheckboxCardsElement = ComponentRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxCardsProps = ComponentPropsWithoutRef<
  typeof CheckboxGroupPrimitive.Root
>;

const CheckboxCards = forwardRef<CheckboxCardsElement, CheckboxCardsProps>(
  ({ className, ...props }, forwardedRef) => (
    <CheckboxGroupPrimitive.Root
      className={cn('grid gap-2', className)}
      {...props}
      ref={forwardedRef}
    />
  ),
);

CheckboxCards.displayName = CheckboxGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

type CheckboxCardsItemElement = ComponentRef<
  typeof CheckboxGroupPrimitive.Item
>;

interface CheckboxCardsItemProps
  extends ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item> {
  checkboxClassName?: string;
}

const CheckboxCardsItem = forwardRef<
  CheckboxCardsItemElement,
  CheckboxCardsItemProps
>(({ children, className, checkboxClassName, ...props }, forwardedRef) => (
  <label
    className={cn(
      'group flex items-center justify-center gap-4 rounded-md border p-4',
      className,
    )}
  >
    {children}
    <CheckboxGroupPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'border-input peer flex size-4 shrink-0 cursor-pointer rounded border shadow-sm',
        'group-hover:border-primary',
        'aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground',
        'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
        'disabled:cursor-default disabled:opacity-50',
        checkboxClassName,
      )}
      {...props}
    >
      <CheckboxGroupPrimitive.CheckboxGroupIndicator className="flex size-full items-center justify-center text-current">
        <CheckIcon className="size-3.5" />
      </CheckboxGroupPrimitive.CheckboxGroupIndicator>
    </CheckboxGroupPrimitive.Item>
  </label>
));

CheckboxCardsItem.displayName = CheckboxGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  CheckboxCards,
  CheckboxCardsItem,
  type CheckboxCardsItemProps,
  type CheckboxCardsProps,
};
