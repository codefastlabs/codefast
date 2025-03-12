import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as InputNumberPrimitive from '@codefast-ui/input-number';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { buttonVariants } from '@/components/button';
import { inputVariants } from '@/components/input';
import { Spinner } from '@/components/spinner';

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

function InputNumber({
  id,
  ariaDecrementLabel,
  ariaIncrementLabel,
  className,
  defaultValue,
  disabled,
  formatOptions,
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
}: ComponentProps<typeof InputNumberPrimitive.Item> &
  ComponentProps<typeof InputNumberPrimitive.Root> &
  VariantProps<typeof inputVariants>): JSX.Element {
  return (
    <InputNumberPrimitive.Root
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      className={root({ className: ['pr-0', className] })}
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
      spinner={spinner || <Spinner />}
      step={step}
      suffix={suffix}
      value={value}
      onChange={onChange}
    >
      <InputNumberPrimitive.Item
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className={input()}
        spellCheck="false"
        {...props}
      />

      <div
        className="peer-hover:divide-input-hover peer-hover:border-l-input-hover peer-focus:divide-input-focus peer-focus:border-l-input-focus divide-input border-input order-last ml-auto grid h-full shrink-0 divide-y border-l"
        data-slot="input-number-buttons"
      >
        <InputNumberPrimitive.IncrementButton
          aria-label="Increment"
          className={buttonVariants({
            className: 'h-full rounded-none rounded-tr-[calc(var(--radius-lg)-1px)]',
            variant: 'ghost',
          })}
          data-slot="input-number-increment-button"
        >
          <ChevronUpIcon />
        </InputNumberPrimitive.IncrementButton>

        <InputNumberPrimitive.DecrementButton
          aria-label="Decrement"
          className={buttonVariants({
            className: 'h-full rounded-none rounded-br-[calc(var(--radius-lg)-1px)]',
            variant: 'ghost',
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
 * This component is an alias of the Input component.
 * Please use the Input component instead to ensure consistency.
 */
const NumberInput = InputNumber;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputNumber, NumberInput };
