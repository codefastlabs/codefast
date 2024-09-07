'use client';

import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import * as CheckboxGroupPrimitive from '@codefast/primitive/checkbox-group';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

type CheckboxCardsElement = React.ElementRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxCardsProps = React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Root>;

const CheckboxCards = React.forwardRef<CheckboxCardsElement, CheckboxCardsProps>(
  ({ className, ...props }, forwardedRef) => {
    return <CheckboxGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={forwardedRef} />;
  },
);

CheckboxCards.displayName = CheckboxGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

type CheckboxCardsItemElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>;

interface CheckboxCardsItemProps extends React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item> {
  checkboxClassName?: string;
}

const CheckboxCardsItem = React.forwardRef<CheckboxCardsItemElement, CheckboxCardsItemProps>(
  ({ children, className, checkboxClassName, ...props }, forwardedRef) => {
    return (
      <label className={cn('flex items-center justify-center gap-4 rounded-md border p-4', className)}>
        {children}
        <CheckboxGroupPrimitive.Item
          ref={forwardedRef}
          className={cn(
            'border-input aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground peer flex size-4 shrink-0 cursor-pointer rounded-sm border shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50',
            checkboxClassName,
          )}
          {...props}
        >
          <CheckboxGroupPrimitive.CheckboxGroupIndicator className="flex size-full items-center justify-center text-current">
            <CheckIcon className="size-3.5" />
          </CheckboxGroupPrimitive.CheckboxGroupIndicator>
        </CheckboxGroupPrimitive.Item>
      </label>
    );
  },
);

CheckboxCardsItem.displayName = CheckboxGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxCards, CheckboxCardsItem, type CheckboxCardsProps, type CheckboxCardsItemProps };
