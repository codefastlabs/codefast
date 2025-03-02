import type { ComponentProps, JSX } from 'react';

import * as InputNumberPrimitive from '@codefast-ui/number-input';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import type { InputVariantsProps } from '@/variants/input.variants';

import { Spinner } from '@/components/spinner';
import { buttonVariants } from '@/variants/button.variants';
import { inputVariants } from '@/variants/input.variants';

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

interface InputNumberProps
  extends InputVariantsProps,
    ComponentProps<typeof InputNumberPrimitive.Root>,
    ComponentProps<typeof InputNumberPrimitive.Item> {}

function InputNumber({
  id,
  ariaDecrementLabel,
  ariaIncrementLabel,
  className,
  defaultValue,
  disabled,
  formatOptions,
  inputSize,
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
      className={root({ className: ['pr-0', className], inputSize })}
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
      spinner={spinner || <Spinner />}
      step={step}
      suffix={suffix}
      value={value}
      onChange={onChange}
    >
      <InputNumberPrimitive.Item
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={input({ inputSize })}
        inputMode="numeric"
        spellCheck="false"
        {...props}
      />
      <div className="peer-hover:divide-input-hover peer-hover:border-l-input-hover peer-focus:divide-input-focus peer-focus:border-l-input-focus divide-input border-input order-last ml-auto grid h-full shrink-0 divide-y border-l transition">
        <InputNumberPrimitive.IncrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-tr-[calc(var(--radius-lg)-1px)]',
            icon: true,
            size: inputSize,
            variant: 'ghost',
          })}
        >
          <ChevronUpIcon />
        </InputNumberPrimitive.IncrementButton>
        <InputNumberPrimitive.DecrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-br-[calc(var(--radius-lg)-1px)]',
            icon: true,
            size: inputSize,
            variant: 'ghost',
          })}
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
 * This type is an alias of the InputNumberProps type.
 * Please use the InputNumberProps type instead to ensure consistency.
 */
type NumberInputProps = InputNumberProps;

/**
 * @deprecated
 * This component is an alias of the Input component.
 * Please use the Input component instead to ensure consistency.
 */
const NumberInput = InputNumber;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { InputNumberProps, NumberInputProps };
export { InputNumber, NumberInput };
