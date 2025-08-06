import type { ComponentProps, JSX } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import type { VariantProps } from "@/lib/utils";

import { buttonVariants } from "@/components/button/button.variants";
import { inputVariants } from "@/components/input/input.variants";
import { Spinner } from "@/components/spinner/spinner";
import { cn } from "@/lib/utils";
import * as InputNumberPrimitive from "@codefast-ui/input-number";

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

interface InputNumberProps
  extends ComponentProps<typeof InputNumberPrimitive.Field>,
    ComponentProps<typeof InputNumberPrimitive.Root>,
    VariantProps<typeof inputVariants> {}

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
      className={root({ className: ["group pr-0", className] })}
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
        className={input()}
        spellCheck="false"
        {...props}
      />
      <div
        className={cn(
          "divide-input border-l-input group-hover:not-group-focus-within:not-has-disabled:border-l-border-ring/60 group-hover:not-group-focus-within:not-has-disabled:divide-border-ring/60 group-focus-within:border-l-ring group-focus-within:divide-ring group-has-aria-invalid:border-l-destructive group-has-aria-invalid:divide-destructive group-hover:group-has-aria-invalid:not-group-focus-within:not-has-disabled:border-l-destructive/60 group-hover:group-has-aria-invalid:not-group-focus-within:not-has-disabled:divide-destructive/60 order-last ml-auto grid h-full shrink-0 divide-y border-l transition",
          "*:[button]:focus-visible:ring-0 *:[button]:focus-visible:bg-ring/50 group-has-aria-invalid:*:[button]:focus-visible:bg-destructive/20 dark:group-has-aria-invalid:*:[button]:focus-visible:bg-destructive/40",
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
 * Deprecated
 * -------------------------------------------------------------------------- */

/**
 * @deprecated
 * This component is an alias of the InputNumber component.
 * Please use the InputNumber component instead to ensure consistency.
 */
type NumberInputProps = InputNumberProps;

/**
 * @deprecated
 * This component is an alias of the InputNumber component.
 * Please use the InputNumber component instead to ensure consistency.
 */
const NumberInput = InputNumber;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputNumber, NumberInput };
export type { InputNumberProps, NumberInputProps };
