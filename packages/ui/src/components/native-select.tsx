import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { ChevronDownIcon } from "lucide-react";

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
      className="group/native-select relative w-fit has-[select:disabled]:opacity-50"
      data-size={size}
      data-slot="native-select-wrapper"
    >
      <select
        className={cn(
          "w-full min-w-0 appearance-none rounded-md border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm shadow-xs outline-hidden transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-9 data-[size=sm]:h-8 motion-reduce:transition-none dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        data-size={size}
        data-slot="native-select"
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none"
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
function NativeSelectOption({ ...props }: NativeSelectOptionProps): JSX.Element {
  return <option data-slot="native-select-option" {...props} />;
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
  return <optgroup className={cn(className)} data-slot="native-select-optgroup" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
export type { NativeSelectOptGroupProps, NativeSelectOptionProps, NativeSelectProps };
