"use client";

import type { ComponentProps, JSX, ReactNode } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { toggleVariants } from "@/components/toggle/toggle.variants";
import * as TogglePrimitive from "@radix-ui/react-toggle";

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

interface ToggleProps
  extends Omit<ComponentProps<typeof TogglePrimitive.Root>, "prefix">,
    VariantProps<typeof toggleVariants> {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

function Toggle({
  children,
  className,
  prefix,
  size,
  suffix,
  variant,
  ...props
}: ToggleProps): JSX.Element {
  return (
    <TogglePrimitive.Root
      className={toggleVariants({ className, size, variant })}
      data-slot="toggle"
      {...props}
    >
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
export type { ToggleProps };
