'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { checkboxVariants } from '@/styles/checkbox-variants';

/* -----------------------------------------------------------------------------
 * Variant: Checkbox
 * -------------------------------------------------------------------------- */

const { root, indicator } = checkboxVariants();

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

type CheckboxElement = React.ElementRef<typeof CheckboxPrimitive.Root>;
type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

const Checkbox = React.forwardRef<CheckboxElement, CheckboxProps>(({ className, ...props }, forwardedRef) => (
  <CheckboxPrimitive.Root ref={forwardedRef} className={root({ className })} {...props}>
    <CheckboxPrimitive.Indicator className={indicator()}>
      <CheckIcon className="size-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Checkbox, type CheckboxProps };
