import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { Switch as SwitchPrimitives } from "radix-ui";

/* -----------------------------------------------------------------------------
 * Component: Switch
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SwitchProps = ComponentProps<typeof SwitchPrimitives.Root> & {
  size?: "default" | "sm";
};

/**
 * @since 0.3.16-canary.0
 */
function Switch({ className, size = "default", ...props }: SwitchProps): JSX.Element {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent p-0.75 shadow-xs outline-hidden transition-[background-color,box-shadow] duration-200 ease-snappy focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-disabled:inset-shadow-sm disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 motion-reduce:transition-none motion-reduce:duration-0 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80",
        className,
      )}
      data-size={size}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitives.Thumb
        className="pointer-events-none block rounded-full bg-background shadow-sm transition-transform duration-300 ease-spring group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-3 motion-reduce:transition-none motion-reduce:duration-0 dark:not-data-checked:bg-foreground group-data-[size=default]/switch:data-checked:translate-x-3.5 group-data-[size=sm]/switch:data-checked:translate-x-3 data-unchecked:translate-x-0"
        data-slot="switch-thumb"
      />
    </SwitchPrimitives.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Switch };
export type { SwitchProps };
