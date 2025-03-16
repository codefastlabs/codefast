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
        'hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring has-disabled:opacity-50 border-input group/checkbox-card flex items-start gap-3 rounded-lg border p-3 transition',
        className,
      )}
      data-slot="checkbox-card"
    >
      <CheckboxGroupPrimitive.Item
        className={cn(
          'border-input text-primary-foreground aria-checked:border-primary aria-checked:bg-primary shadow-xs outline-hidden aria-checked:focus-visible:ring-primary/20 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 group-hover/checkbox-card:not-disabled:not-aria-checked:border-ring/60 peer flex size-4 shrink-0 rounded-sm border transition',
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
