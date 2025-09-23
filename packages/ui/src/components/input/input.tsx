import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@/lib/utils";

import { inputVariants } from "@/components/input/input.variants";
import { Spinner } from "@/components/spinner/spinner";
import * as InputPrimitive from "@codefast-ui/input";

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

interface InputProps
  extends ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentProps<typeof InputPrimitive.Field>, "prefix" | "type">,
    VariantProps<typeof inputVariants> {
  type?:
    | "date"
    | "datetime-local"
    | "email"
    | "file"
    | "month"
    | "number"
    | "password"
    | "search"
    | "tel"
    | "text"
    | "time"
    | "url"
    | "week";
}

function Input({
  className,
  disabled,
  loaderPosition,
  loading,
  prefix,
  readOnly,
  spinner,
  suffix,
  ...props
}: InputProps): JSX.Element {
  return (
    <InputPrimitive.Root
      className={root({ className })}
      data-slot="input"
      disabled={disabled}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      readOnly={readOnly}
      spinner={spinner ?? <Spinner key="spinner" />}
      suffix={suffix}
    >
      <InputPrimitive.Field className={input()} data-slot="input-item" {...props} />
    </InputPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Input };
export type { InputProps };
