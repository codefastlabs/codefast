import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import { ChevronDownIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: NativeSelect
 * -------------------------------------------------------------------------- */

type NativeSelectProps = ComponentProps<"select">;

function NativeSelect({ className, ...props }: NativeSelectProps): JSX.Element {
  return (
    <div
      className="group/native-select relative w-fit has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        className={cn(
          "h-9 w-full min-w-0 appearance-none rounded-lg border border-field-border bg-field px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground hover:not-disabled:bg-field-hover disabled:pointer-events-none disabled:cursor-not-allowed",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring-focus",
          "aria-invalid:border-destructive aria-invalid:ring-ring-destructive",
          className,
        )}
        data-slot="native-select"
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground opacity-50 select-none"
        data-slot="native-select-icon"
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NativeSelectOption
 * -------------------------------------------------------------------------- */

type NativeSelectOptionProps = ComponentProps<"option">;

function NativeSelectOption({ ...props }: NativeSelectOptionProps): JSX.Element {
  return <option data-slot="native-select-option" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: NativeSelectOptGroup
 * -------------------------------------------------------------------------- */

type NativeSelectOptGroupProps = ComponentProps<"optgroup">;

function NativeSelectOptGroup({ className, ...props }: NativeSelectOptGroupProps): JSX.Element {
  return <optgroup className={cn(className)} data-slot="native-select-optgroup" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
export type { NativeSelectOptGroupProps, NativeSelectOptionProps, NativeSelectProps };
