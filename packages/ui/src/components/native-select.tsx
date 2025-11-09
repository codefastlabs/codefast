import type { ComponentProps, JSX } from "react";

import { ChevronDownIcon } from "lucide-react";

import { cn } from "@codefast/tailwind-variants";

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
          "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 dark:hover:bg-input/50 h-9 w-full min-w-0 appearance-none rounded-lg border bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className,
        )}
        data-slot="native-select"
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 opacity-50 select-none"
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
