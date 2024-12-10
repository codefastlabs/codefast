import * as NumberInputPrimitive from '@codefast-ui/number-input';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { type ComponentProps, type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { Spinner } from '@/components/spinner';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/button-variants';
import { inputVariants, type InputVariantsProps } from '@/styles/input-variants';

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

type NumberInputElement = ComponentRef<typeof NumberInputPrimitive.Item>;
interface NumberInputProps
  extends InputVariantsProps,
    ComponentProps<typeof NumberInputPrimitive.Root>,
    ComponentPropsWithoutRef<typeof NumberInputPrimitive.Item> {}

const NumberInput = forwardRef<NumberInputElement, NumberInputProps>(
  (
    {
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
    },
    forwardedRef,
  ) => (
    <NumberInputPrimitive.Root
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
      <div
        className={cn(
          'peer-focus:divide-ring peer-focus:border-l-ring',
          'divide-input border-input order-last ml-auto grid h-full shrink-0 divide-y overflow-hidden rounded-r-[calc(theme(borderRadius.md)-1px)] border-l transition',
        )}
      >
        <NumberInputPrimitive.IncrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-tr-[calc(theme(borderRadius.md)-1px)]',
            icon: true,
            size: inputSize,
            variant: 'ghost',
          })}
        >
          <ChevronUpIcon />
        </NumberInputPrimitive.IncrementButton>
        <NumberInputPrimitive.DecrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-br-[calc(theme(borderRadius.md)-1px)]',
            icon: true,
            size: inputSize,
            variant: 'ghost',
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
