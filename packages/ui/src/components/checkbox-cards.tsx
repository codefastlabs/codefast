'use client';

import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import * as CheckboxGroupPrimitive from '@codefast/primitive/checkbox-group';
import { cn } from '@/lib/utils';
import { checkboxCardsVariants } from '@/styles/checkbox-cards-variants';

/* -----------------------------------------------------------------------------
 * Variant: CheckboxCards
 * -------------------------------------------------------------------------- */

const { root, itemWrapper, item, indicator } = checkboxCardsVariants();

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

type CheckboxCardsElement = React.ElementRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxCardsProps = React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Root>;

const CheckboxCards = React.forwardRef<CheckboxCardsElement, CheckboxCardsProps>(
  ({ className, ...props }, forwardedRef) => (
    <CheckboxGroupPrimitive.Root className={root({ className })} {...props} ref={forwardedRef} />
  ),
);

CheckboxCards.displayName = CheckboxGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

type CheckboxCardsItemElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>;

interface CheckboxCardsItemProps extends React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item> {
  classNames?: {
    indicator?: string;
    item?: string;
    wrapper?: string;
  };
}

const CheckboxCardsItem = React.forwardRef<CheckboxCardsItemElement, CheckboxCardsItemProps>(
  ({ children, className, classNames, ...props }, forwardedRef) => (
    <label className={itemWrapper({ className: cn(className, classNames?.wrapper) })}>
      {children}
      <CheckboxGroupPrimitive.Item ref={forwardedRef} className={item({ className: classNames?.item })} {...props}>
        <CheckboxGroupPrimitive.CheckboxGroupIndicator className={indicator({ className: classNames?.indicator })}>
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

export { CheckboxCards, CheckboxCardsItem, type CheckboxCardsProps, type CheckboxCardsItemProps };
