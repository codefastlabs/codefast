import { Switch as SwitchPrimitives } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

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
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all ease-snappy outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-4.5 data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      data-size={size}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitives.Thumb
        className="pointer-events-none block rounded-full bg-background ring-0 transition-transform ease-spring group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-3.5 group-data-[size=sm]/switch:data-checked:translate-x-2.5 rtl:group-data-[size=default]/switch:data-checked:-translate-x-3.5 rtl:group-data-[size=sm]/switch:data-checked:-translate-x-2.5 dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 rtl:group-data-[size=default]/switch:data-unchecked:-translate-x-0 rtl:group-data-[size=sm]/switch:data-unchecked:-translate-x-0 dark:data-unchecked:bg-foreground"
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
