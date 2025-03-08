import type { ComponentProps, JSX, ReactNode } from 'react';

import * as TogglePrimitive from '@radix-ui/react-toggle';

import type { ToggleVariantsProps } from '@/variants/toggle.variants';

import { toggleVariants } from '@/variants/toggle.variants';

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

function Toggle({
  children,
  className,
  icon,
  prefix,
  size,
  suffix,
  variant,
  ...props
}: Omit<ComponentProps<typeof TogglePrimitive.Root>, 'prefix'> &
  ToggleVariantsProps & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  }): JSX.Element {
  return (
    <TogglePrimitive.Root className={toggleVariants({ className, icon, size, variant })} data-slot="toggle" {...props}>
      {prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </TogglePrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle };
