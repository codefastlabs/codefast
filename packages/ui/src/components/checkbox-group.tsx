'use client';

import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import * as CheckboxGroupPrimitive from '@codefast/primitive/checkbox-group';
import { checkboxGroupVariants } from '@/styles/checkbox-group-variants';

/* -----------------------------------------------------------------------------
 * Variant: CheckboxGroup
 * -------------------------------------------------------------------------- */

const { root, item, indicator } = checkboxGroupVariants();

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

type CheckboxGroupElement = React.ElementRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxGroupProps = React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Root>;

const CheckboxGroup = React.forwardRef<CheckboxGroupElement, CheckboxGroupProps>(
  ({ className, ...props }, forwardedRef) => (
    <CheckboxGroupPrimitive.Root ref={forwardedRef} className={root({ className })} {...props} />
  ),
);

CheckboxGroup.displayName = 'CheckboxGroup';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

type CheckboxGroupItemElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>;
type CheckboxGroupItemProps = React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item>;

const CheckboxGroupItem = React.forwardRef<CheckboxGroupItemElement, CheckboxGroupItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <CheckboxGroupPrimitive.Item ref={forwardedRef} className={item({ className })} {...props}>
      <CheckboxGroupPrimitive.CheckboxGroupIndicator className={indicator()}>
        <CheckIcon className="size-3.5" />
      </CheckboxGroupPrimitive.CheckboxGroupIndicator>
    </CheckboxGroupPrimitive.Item>
  ),
);

CheckboxGroupItem.displayName = 'CheckboxGroupItem';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxGroup, CheckboxGroupItem, type CheckboxGroupProps, type CheckboxGroupItemProps };
