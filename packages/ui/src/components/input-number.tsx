import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { Spinner } from "#/components/spinner";
import * as InputNumberPrimitive from "#/primitives/input-number";
import { buttonVariants } from "#/variants/button";
import type { InputNumberVariants } from "#/variants/input-number";
import { inputNumberVariants } from "#/variants/input-number";

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface InputNumberProps
  extends
    ComponentProps<typeof InputNumberPrimitive.Field>,
    ComponentProps<typeof InputNumberPrimitive.Root>,
    InputNumberVariants {}

/**
 * @since 0.3.16-canary.0
 */
function InputNumber({
  ariaDecrementLabel = "Decrement",
  ariaIncrementLabel = "Increment",
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
  variant = "stepper",
  ...props
}: InputNumberProps): JSX.Element {
  const isSplit = variant === "split";
  const { decrementButton, field, incrementButton, root, stepper, stepperButton } = inputNumberVariants({ variant });

  return (
    <InputNumberPrimitive.Root
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      className={root({ className })}
      data-slot="input-number"
      data-variant={variant}
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
      {isSplit ? (
        <InputNumberPrimitive.DecrementButton
          className={buttonVariants({
            className: decrementButton(),
            variant: "ghost",
          })}
          data-slot="input-number-decrement-button"
        >
          <MinusIcon />
        </InputNumberPrimitive.DecrementButton>
      ) : null}

      <InputNumberPrimitive.Field
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className={field()}
        spellCheck="false"
        {...props}
      />

      {isSplit ? (
        <InputNumberPrimitive.IncrementButton
          className={buttonVariants({
            className: incrementButton(),
            variant: "ghost",
          })}
          data-slot="input-number-increment-button"
        >
          <PlusIcon />
        </InputNumberPrimitive.IncrementButton>
      ) : (
        <div className={stepper()} data-slot="input-number-buttons">
          <InputNumberPrimitive.IncrementButton
            className={buttonVariants({
              className: stepperButton(),
              variant: "ghost",
            })}
            data-slot="input-number-increment-button"
          >
            <ChevronUpIcon className="size-3.5" />
          </InputNumberPrimitive.IncrementButton>

          <InputNumberPrimitive.DecrementButton
            className={buttonVariants({
              className: stepperButton(),
              variant: "ghost",
            })}
            data-slot="input-number-decrement-button"
          >
            <ChevronDownIcon className="size-3.5" />
          </InputNumberPrimitive.DecrementButton>
        </div>
      )}
    </InputNumberPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputNumber };
export type { InputNumberProps };
