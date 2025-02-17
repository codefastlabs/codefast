import type { ComponentProps, JSX } from 'react';

import * as NumberInputPrimitive from '@codefast-ui/number-input';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import type { InputVariantsProps } from '@/variants/input.variants';

import { Spinner } from '@/components/spinner';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';
import { inputVariants } from '@/variants/input.variants';

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

interface NumberInputProps
  extends InputVariantsProps,
    ComponentProps<typeof NumberInputPrimitive.Root>,
    ComponentProps<typeof NumberInputPrimitive.Item> {}

function NumberInput({
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
}: NumberInputProps): JSX.Element {
  return (
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
          'divide-input border-input order-last ml-auto grid h-full shrink-0 divide-y overflow-hidden rounded-r-[calc(var(--radius-md)-1px)] border-l transition',
        )}
      >
        <NumberInputPrimitive.IncrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-tr-[calc(var(--radius-md)-1px)]',
            icon: true,
            size: inputSize,
            variant: 'ghost',
          })}
        >
          <ChevronUpIcon />
        </NumberInputPrimitive.IncrementButton>
        <NumberInputPrimitive.DecrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-br-[calc(var(--radius-md)-1px)]',
            icon: true,
            size: inputSize,
            variant: 'ghost',
          })}
        >
          <ChevronDownIcon />
        </NumberInputPrimitive.DecrementButton>
      </div>
    </NumberInputPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { NumberInputProps };
export { NumberInput };
