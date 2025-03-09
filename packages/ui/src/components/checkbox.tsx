import type { ComponentProps, JSX } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>): JSX.Element {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'border-input text-primary-foreground hover:not-disabled:not-aria-checked:border-input-hover aria-checked:border-primary aria-checked:bg-primary focus-visible:ring-ring focus-visible:ring-3 not-disabled:shadow-xs peer inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition-shadow focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex items-center justify-center text-current transition-none"
        data-slot="checkbox-indicator"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Checkbox };
