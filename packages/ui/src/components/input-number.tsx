"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#utils/tv";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { buttonVariants } from "#components/button";
import { Spinner } from "#components/spinner";
import * as InputNumberPrimitive from "#primitives/input-number";

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

interface InputNumberProps
  extends
    ComponentProps<typeof InputNumberPrimitive.Field>,
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
        "group peer flex h-9 w-full grow items-center gap-3",
        "rounded-lg border border-field-border bg-field",
        "px-3 pr-0",
        "text-base md:text-sm",
        "transition not-has-disabled:shadow-xs",
        "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>svg]:text-muted-foreground",
        "hover:not-has-disabled:not-focus-within:border-field-border-hover",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring-focus",
        "has-disabled:opacity-50",
        "has-aria-invalid:border-destructive focus-within:has-aria-invalid:ring-ring-destructive hover:not-has-disabled:not-focus-within:has-aria-invalid:border-destructive/60",
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
        className={cn(
          "h-9 w-full min-w-0",
          "rounded-md border border-field-border bg-transparent shadow-xs",
          "px-3 py-1",
          "text-base md:text-sm",
          "transition-[color,box-shadow] outline-none",
          "selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring-focus",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-ring-destructive",
        )}
        spellCheck="false"
        {...props}
      />
      <div
        className={cn(
          "order-last ml-auto grid h-full shrink-0",
          "divide-y divide-field-border border-l border-l-field-border",
          "transition",
          "group-focus-within:divide-ring group-focus-within:border-l-ring",
          "group-hover:not-group-focus-within:not-has-disabled:divide-ring/60 group-hover:not-group-focus-within:not-has-disabled:border-l-ring/60",
          "group-has-aria-invalid:divide-destructive group-has-aria-invalid:border-l-destructive",
          "group-hover:group-has-aria-invalid:not-group-focus-within:not-has-disabled:divide-destructive/60 group-hover:group-has-aria-invalid:not-group-focus-within:not-has-disabled:border-l-destructive/60",
          "*:[button]:focus-visible:bg-ring-focus *:[button]:focus-visible:ring-0 group-has-aria-invalid:*:[button]:focus-visible:bg-ring-destructive",
        )}
        data-slot="input-number-buttons"
      >
        <InputNumberPrimitive.IncrementButton
          aria-label="Increment"
          className={buttonVariants({
            className:
              "text-muted-foreground h-auto rounded-none rounded-tr-[calc(var(--radius-xl)-1px)]",
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
              "text-muted-foreground h-auto rounded-none rounded-br-[calc(var(--radius-xl)-1px)]",
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
