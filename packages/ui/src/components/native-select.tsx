import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: NativeSelect
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "default" | "sm";
};

/**
 * @since 0.3.16-canary.0
 */
function NativeSelect({ className, size = "default", ...props }: NativeSelectProps): JSX.Element {
  return (
    <div
      className={cn("group/native-select relative w-fit has-[select:disabled]:opacity-50", className)}
      data-size={size}
      data-slot="native-select-wrapper"
    >
      <select
        className="h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 ps-2.5 pe-8 text-sm shadow-xs transition-[color,box-shadow] outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        data-size={size}
        data-slot="native-select"
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute inset-e-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground select-none"
        data-slot="native-select-icon"
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NativeSelectOption
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type NativeSelectOptionProps = ComponentProps<"option">;

/**
 * @since 0.3.16-canary.0
 */
function NativeSelectOption({ className, ...props }: NativeSelectOptionProps): JSX.Element {
  return (
    <option className={cn("bg-[Canvas] text-[CanvasText]", className)} data-slot="native-select-option" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NativeSelectOptGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type NativeSelectOptGroupProps = ComponentProps<"optgroup">;

/**
 * @since 0.3.16-canary.0
 */
function NativeSelectOptGroup({ className, ...props }: NativeSelectOptGroupProps): JSX.Element {
  return (
    <optgroup
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      data-slot="native-select-optgroup"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
export type { NativeSelectOptGroupProps, NativeSelectOptionProps, NativeSelectProps };
