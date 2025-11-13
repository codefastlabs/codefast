"use client";

import type { ComponentProps, JSX } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { buttonVariants } from "@/components/button";
import { Spinner } from "@/components/spinner";
import * as InputNumberPrimitive from "@/primitives/input-number";
import { cn } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

interface InputNumberProps
  extends ComponentProps<typeof InputNumberPrimitive.Field>,
    ComponentProps<typeof InputNumberPrimitive.Root> {}

function InputNumber({
  ariaDecrementLabel,
  ariaIncrementLabel,
  className,
  defaultValue,
  disabled,
  formatOptions,
  id,
  loaderPosition,
  loading,
  max,
  min,
  onChange,
  prefix,
  readOnly,
  spinner,
  step,
  suffix,
  value,
  ...props
}: InputNumberProps): JSX.Element {
  return (
    <InputNumberPrimitive.Root
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      className={cn(
        "group border-input hover:not-has-disabled:not-focus-within:border-ring/60 focus-within:border-ring focus-within:ring-ring/50 [&>svg]:text-muted-foreground has-aria-invalid:border-destructive hover:not-has-disabled:not-focus-within:has-aria-invalid:border-destructive/60 focus-within:has-aria-invalid:ring-destructive/20 dark:focus-within:has-aria-invalid:ring-destructive/40 dark:bg-input/30 peer flex h-9 w-full grow items-center gap-3 rounded-lg border px-3 pr-0 text-base transition not-has-disabled:shadow-xs focus-within:ring-3 has-disabled:opacity-50 md:text-sm [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="input-number"
      defaultValue={defaultValue}
      disabled={disabled}
      formatOptions={formatOptions}
      id={id}
      loaderPosition={loaderPosition}
      loading={loading}
      max={max}
      min={min}
      prefix={prefix}
      readOnly={readOnly}
      spinner={spinner ?? <Spinner key="spinner" />}
      step={step}
      suffix={suffix}
      value={value}
      onChange={onChange}
    >
      <InputNumberPrimitive.Field
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        spellCheck="false"
        {...props}
      />
      <div
        className={cn(
          "divide-input border-l-input group-hover:not-group-focus-within:not-has-disabled:border-l-border-ring/60 group-hover:not-group-focus-within:not-has-disabled:divide-border-ring/60 group-focus-within:border-l-ring group-focus-within:divide-ring group-has-aria-invalid:border-l-destructive group-has-aria-invalid:divide-destructive group-hover:group-has-aria-invalid:not-group-focus-within:not-has-disabled:border-l-destructive/60 group-hover:group-has-aria-invalid:not-group-focus-within:not-has-disabled:divide-destructive/60 order-last ml-auto grid h-full shrink-0 divide-y border-l transition",
          "*:[button]:focus-visible:bg-ring/50 group-has-aria-invalid:*:[button]:focus-visible:bg-destructive/20 dark:group-has-aria-invalid:*:[button]:focus-visible:bg-destructive/40 *:[button]:focus-visible:ring-0",
        )}
        data-slot="input-number-buttons"
      >
        <InputNumberPrimitive.IncrementButton
          aria-label="Increment"
          className={buttonVariants({
            className:
              "text-muted-foreground h-auto rounded-none rounded-tr-[calc(var(--radius-lg)-1px)]",
            variant: "ghost",
          })}
          data-slot="input-number-increment-button"
        >
          <ChevronUpIcon />
        </InputNumberPrimitive.IncrementButton>
        <InputNumberPrimitive.DecrementButton
          aria-label="Decrement"
          className={buttonVariants({
            className:
              "text-muted-foreground h-auto rounded-none rounded-br-[calc(var(--radius-lg)-1px)]",
            variant: "ghost",
          })}
          data-slot="input-number-decrement-button"
        >
          <ChevronDownIcon />
        </InputNumberPrimitive.DecrementButton>
      </div>
    </InputNumberPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputNumber };
export type { InputNumberProps };
