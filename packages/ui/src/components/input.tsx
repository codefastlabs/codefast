"use client";

import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { Spinner } from "@/components/spinner";
import * as InputPrimitive from "@/primitives/input";
import { tv } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    input:
      "placeholder:text-muted-foreground outline-hidden file:py-1.75 size-full file:bg-transparent file:font-medium",
    root: "border-input not-has-disabled:shadow-xs hover:not-has-disabled:not-focus-within:border-ring/60 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3 has-disabled:opacity-50 [&>svg]:text-muted-foreground has-aria-invalid:border-destructive hover:not-has-disabled:not-focus-within:has-aria-invalid:border-destructive/60 focus-within:has-aria-invalid:ring-destructive/20 dark:focus-within:has-aria-invalid:ring-destructive/40 dark:bg-input/30 peer flex h-9 w-full grow items-center gap-3 rounded-lg border px-3 text-base transition md:text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  },
});

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

export { inputVariants };
export { Input };
export type { InputProps };
