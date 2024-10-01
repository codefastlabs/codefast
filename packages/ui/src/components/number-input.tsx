import * as React from 'react';
import * as NumberInputPrimitive from '@codefast-ui/number-input';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { buttonVariants } from '@/styles/button-variants';
import { inputVariants, type InputVariantsProps } from '@/styles/input-variants';
import { Spinner } from '@/components/spinner';

const { root, input } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

type NumberInputElement = React.ComponentRef<typeof NumberInputPrimitive.Item>;
interface NumberInputProps
  extends InputVariantsProps,
    React.ComponentProps<typeof NumberInputPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof NumberInputPrimitive.Item> {}

const NumberInput = React.forwardRef<NumberInputElement, NumberInputProps>(
  (
    {
      ariaDecrementLabel,
      ariaIncrementLabel,
      className,
      defaultValue,
      disabled,
      formatOptions,
      id,
      inputSize,
      loaderPosition = 'prefix',
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
    },
    forwardedRef,
  ) => (
    <NumberInputPrimitive.Root
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      className={root({ inputSize, className: ['pr-0', className] })}
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
      <NumberInputPrimitive.Item
        ref={forwardedRef}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={input({ inputSize })}
        inputMode="numeric"
        spellCheck="false"
        {...props}
      />
      <div className="order-last ml-auto grid h-full divide-y overflow-hidden rounded-r-md border-l">
        <NumberInputPrimitive.IncrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-tr-md',
            icon: true,
            variant: 'ghost',
            size: inputSize,
          })}
        >
          <ChevronUpIcon />
        </NumberInputPrimitive.IncrementButton>
        <NumberInputPrimitive.DecrementButton
          className={buttonVariants({
            className: 'rounded-tb-md h-full rounded-none',
            icon: true,
            variant: 'ghost',
            size: inputSize,
          })}
        >
          <ChevronDownIcon />
        </NumberInputPrimitive.DecrementButton>
      </div>
    </NumberInputPrimitive.Root>
  ),
);

NumberInput.displayName = 'NumberInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { NumberInput, type NumberInputProps };
