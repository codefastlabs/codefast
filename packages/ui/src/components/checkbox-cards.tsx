import type { ComponentProps, JSX } from 'react';

import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

function CheckboxCards(props: ComponentProps<typeof CheckboxGroupPrimitive.Root>): JSX.Element {
  return <CheckboxGroupPrimitive.Root {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

function CheckboxCardsItem({
  checkboxClassName,
  children,
  className,
  ...props
}: ComponentProps<typeof CheckboxGroupPrimitive.Item> & {
  checkboxClassName?: string;
}): JSX.Element {
  return (
    <label
      className={cn(
        'hover:not-has-disabled:bg-secondary has-aria-checked:border-primary has-focus-visible:border-input-focus has-focus-visible:ring-ring has-focus-visible:ring-3 has-focus-visible:outline-none has-disabled:opacity-50 border-secondary group flex items-center justify-center gap-4 rounded-lg border-2 p-4',
        className,
      )}
      data-slot="checkbox-card"
    >
      {children}
      <CheckboxGroupPrimitive.Item
        className={cn(
          'border-input text-primary-foreground group-hover:not-disabled:not-aria-checked:border-input-hover aria-checked:border-primary aria-checked:bg-primary peer flex size-4 shrink-0 rounded-sm border focus-visible:outline-none',
          checkboxClassName,
        )}
        data-slot="checkbox-card-item"
        {...props}
      >
        <CheckboxGroupPrimitive.CheckboxGroupIndicator data-slot="checkbox-card-indicator">
          <CheckIcon className="size-3.5" />
        </CheckboxGroupPrimitive.CheckboxGroupIndicator>
      </CheckboxGroupPrimitive.Item>
    </label>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxCards, CheckboxCardsItem };
