import type { ComponentProps, JSX, ReactNode } from "react";

import * as TogglePrimitive from "@radix-ui/react-toggle";

import type { VariantProps } from "@/lib/utils";

import { toggleVariants } from "@/components/toggle/toggle-variants";

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

function Toggle({
  children,
  className,
  prefix,
  size,
  suffix,
  variant,
  ...props
}: Omit<ComponentProps<typeof TogglePrimitive.Root>, "prefix"> &
  VariantProps<typeof toggleVariants> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  }): JSX.Element {
  return (
    <TogglePrimitive.Root className={toggleVariants({ className, size, variant })} data-slot="toggle" {...props}>
      {prefix}
      {children}
      {suffix}
    </TogglePrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle };
