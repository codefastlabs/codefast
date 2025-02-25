import type { ComponentProps, JSX } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;

function Checkbox({ className, ...props }: CheckboxProps): JSX.Element {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer',
        'border-input text-primary-foreground shadow-xs inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition',
        'hover:not-disabled:not-aria-checked:border-input-hover',
        'aria-checked:border-primary aria-checked:bg-primary',
        'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CheckboxProps };
export { Checkbox };
