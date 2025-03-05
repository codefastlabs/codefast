import type { ComponentProps, JSX } from 'react';

import * as CheckboxGroupPrimitive from '@codefast-ui/checkbox-group';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

type CheckboxCardsProps = ComponentProps<typeof CheckboxGroupPrimitive.Root>;

function CheckboxCards(props: CheckboxCardsProps): JSX.Element {
  return <CheckboxGroupPrimitive.Root {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

interface CheckboxCardsItemProps extends ComponentProps<typeof CheckboxGroupPrimitive.Item> {
  checkboxClassName?: string;
}

function CheckboxCardsItem({ checkboxClassName, children, className, ...props }: CheckboxCardsItemProps): JSX.Element {
  return (
    <label
      className={cn(
        'hover:not-has-disabled:bg-secondary has-aria-checked:border-primary has-focus-visible:border-input-focus has-focus-visible:ring-ring has-focus-visible:ring-3 has-focus-visible:outline-none has-disabled:opacity-50 border-secondary group flex items-center justify-center gap-4 rounded-lg border-2 p-4 transition',
        className,
      )}
    >
      {children}
      <CheckboxGroupPrimitive.Item
        className={cn(
          'border-input text-primary-foreground group-hover:not-disabled:not-aria-checked:border-input-hover aria-checked:border-primary aria-checked:bg-primary peer flex size-4 shrink-0 rounded-sm border transition focus-visible:outline-none',
          checkboxClassName,
        )}
        {...props}
      >
        <CheckboxGroupPrimitive.CheckboxGroupIndicator>
          <CheckIcon className="size-3.5" />
        </CheckboxGroupPrimitive.CheckboxGroupIndicator>
      </CheckboxGroupPrimitive.Item>
    </label>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CheckboxCardsItemProps, CheckboxCardsProps };
export { CheckboxCards, CheckboxCardsItem };
