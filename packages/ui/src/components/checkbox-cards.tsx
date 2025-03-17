import type { ComponentProps, JSX } from 'react';

import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from 'lucide-react';

import { Label } from '@/components/label';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

function CheckboxCards(props: ComponentProps<typeof CheckboxGroupPrimitive.Root>): JSX.Element {
  return <CheckboxGroupPrimitive.Root data-slot="checkbox-cards" {...props} />;
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
    <Label
      className={cn(
        'border-input flex items-start gap-3 rounded-lg border p-3 transition',
        'hover:not-has-disabled:not-has-aria-checked:bg-secondary',
        'has-aria-checked:bg-primary/10 has-aria-checked:border-primary',
        'has-focus-visible:border-ring',
        'has-disabled:opacity-50',
        className,
      )}
      data-slot="checkbox-card"
    >
      <CheckboxGroupPrimitive.Item
        className={cn(
          'border-input text-primary-foreground shadow-xs outline-hidden peer flex size-4 shrink-0 rounded-sm border transition',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
          'focus-visible:aria-checked:ring-primary/20',
          'aria-checked:border-primary aria-checked:bg-primary aria-checked:shadow-primary/50',
          checkboxClassName,
        )}
        data-slot="checkbox-card-item"
        {...props}
      >
        <CheckboxGroupPrimitive.CheckboxGroupIndicator data-slot="checkbox-card-indicator">
          <CheckIcon className="size-3.5" />
        </CheckboxGroupPrimitive.CheckboxGroupIndicator>
      </CheckboxGroupPrimitive.Item>
      {children}
    </Label>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxCards, CheckboxCardsItem };
