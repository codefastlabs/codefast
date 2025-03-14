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
        'border-input text-primary-foreground hover:not-disabled:not-aria-checked:border-ring/60 aria-checked:border-primary aria-checked:bg-primary focus-visible:border-ring aria-checked:focus-visible:ring-primary/20 focus-visible:ring-ring/20 focus-visible:ring-3 not-disabled:shadow-xs outline-hidden aria-invalid:ring-destructive/20 aria-invalid:border-destructive hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 peer inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition disabled:opacity-50',
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
