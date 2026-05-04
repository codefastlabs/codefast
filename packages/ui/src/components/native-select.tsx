import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { ChevronDownIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: NativeSelect
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type NativeSelectProps = ComponentProps<"select">;

/**
 * @since 0.3.16-canary.0
 */
function NativeSelect({ className, ...props }: NativeSelectProps): JSX.Element {
  return (
    <div
      className={cn("group/native-select relative", "w-fit", "has-[select:disabled]:opacity-50")}
      data-slot="native-select-wrapper"
    >
      <select
        className={cn(
          "h-9 w-full min-w-0 px-3 py-2 pr-9",
          "rounded-lg border border-input",
          "bg-transparent shadow-xs outline-none",
          "text-sm",
          "appearance-none transition-[color,box-shadow]",
          "selection:bg-primary selection:text-primary-foreground",
          "placeholder:text-muted-foreground",
          "disabled:pointer-events-none disabled:cursor-not-allowed",
          "dark:bg-input/30",
          "dark:hover:bg-input/50",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          "dark:aria-invalid:ring-destructive/40",
          className,
        )}
        data-slot="native-select"
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 right-3.5",
          "size-4 text-muted-foreground",
          "-translate-y-1/2 opacity-50",
          "pointer-events-none select-none",
        )}
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
