'use client';

import * as React from 'react';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { composeEventHandlers } from '@radix-ui/primitive';
import { Primitive } from '@radix-ui/react-primitive';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import * as InputPrimitive from '@/react/primitive/input';
import { createInputScope } from '@/react/primitive/input';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_NAME = 'NumberInput';

type ScopedProps<P> = P & {
  __scopeNumberInput?: Scope;
};
const [createNumberInputContext, createNumberInputScope] = createContextScope(NUMBER_INPUT_NAME, [createInputScope]);
const useInputScope = createInputScope();

interface NumberInputContextValue {
  formatOptions: Intl.NumberFormatOptions;
  formatValue: (value: number | undefined) => string;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (value: number) => void;
  onDecrement: () => void;
  onIncrement: () => void;
  parseValue: (value: string | number | readonly string[] | undefined) => number;
  ariaDecrementLabel?: string;
  ariaIncrementLabel?: string;
  disabled?: boolean;
  max?: number;
  min?: number;
  readOnly?: boolean;
  step?: number;
  value?: number;
}

const [NumberInputProvider, useNumberInputContext] =
  createNumberInputContext<NumberInputContextValue>(NUMBER_INPUT_NAME);

interface NumberInputProps extends Omit<InputPrimitive.InputProps, 'prefix' | 'suffix' | 'loading' | 'loaderPosition'> {
  ariaDecrementLabel?: string;
  ariaIncrementLabel?: string;
  defaultValue?: number;
  disabled?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
  max?: number;
  min?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  step?: number;
  value?: number;
}

function NumberInput(numberInputProps: NumberInputProps): React.JSX.Element {
  const {
    __scopeNumberInput,
    ariaDecrementLabel,
    ariaIncrementLabel,
    defaultValue,
    disabled,
    formatOptions = { style: 'decimal', minimumFractionDigits: 0 },
    locale = navigator.language,
    max = Infinity,
    min = -Infinity,
    onChange,
    readOnly,
    step = 1,
    value: valueProp,
    ...props
  } = numberInputProps as ScopedProps<NumberInputProps>;
  const inputScope = useInputScope(__scopeNumberInput);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange,
  });

  const { thousandSeparator, decimalSeparator } = React.useMemo(() => getNumberFormatSeparators(locale), [locale]);

  const formatValue = React.useCallback(
    (inputValue: number | undefined): string => {
      if (inputValue === undefined) {
        return '';
      }

      return isNaN(inputValue) ? '' : new Intl.NumberFormat(locale, formatOptions).format(inputValue);
    },
    [formatOptions, locale],
  );

  const parseValue = React.useCallback(
    (inputValue: string | number | readonly string[] | undefined): number => {
      if (typeof inputValue === 'number') {
        return clamp(inputValue, min, max);
      }

      if (typeof inputValue !== 'string') {
        return NaN;
      }

      const cleanedValue = inputValue.trim().replace(/[^\d.,\-()]/g, '');

      if (cleanedValue === '') {
        return NaN;
      }

      const normalizedValue = normalizeInputValue(cleanedValue, thousandSeparator, decimalSeparator);

      const parsedValue = parseFloat(normalizedValue);

      return isNaN(parsedValue) ? 0 : clamp(parsedValue, min, max);
    },
    [decimalSeparator, max, min, thousandSeparator],
  );

  const handleIncrement = React.useCallback(() => {
    const inputElement = inputRef.current;

    if (!inputElement || disabled || readOnly) {
      return;
    }

    const currentValue = parseValue(inputElement.value) || 0;
    const newValue = clamp(currentValue + step, min, max);

    inputElement.value = formatValue(newValue);
    setValue(newValue);
  }, [disabled, formatValue, max, min, parseValue, readOnly, setValue, step]);

  const handleDecrement = React.useCallback(() => {
    const inputElement = inputRef.current;

    if (!inputElement || disabled || readOnly) {
      return;
    }

    const currentValue = parseValue(inputElement.value) || 0;
    const newValue = clamp(currentValue - step, min, max);

    inputElement.value = formatValue(newValue);
    setValue(newValue);
  }, [disabled, formatValue, max, min, parseValue, readOnly, setValue, step]);

  return (
    <NumberInputProvider
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      disabled={disabled}
      formatOptions={formatOptions}
      formatValue={formatValue}
      inputRef={inputRef}
      max={max}
      min={min}
      parseValue={parseValue}
      readOnly={readOnly}
      scope={__scopeNumberInput}
      value={value}
      onChange={setValue}
      onDecrement={handleDecrement}
      onIncrement={handleIncrement}
    >
      <InputPrimitive.Root {...inputScope} {...props} />
    </NumberInputProvider>
  );
}

NumberInput.displayName = NUMBER_INPUT_NAME;

/* -----------------------------------------------------------------------------
 * Component: NumberInputItem
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_ITEM_NAME = 'NumberInputItem';

type NumberInputItemElement = React.ElementRef<typeof InputPrimitive.Item>;
type NumberInputItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>,
  'min' | 'max' | 'value' | 'step' | 'onChange' | 'defaultValue' | 'disabled' | 'readOnly' | 'prefix'
>;

const NumberInputItem = React.forwardRef<NumberInputItemElement, NumberInputItemProps>(
  ({ __scopeNumberInput, ...props }: ScopedProps<NumberInputItemProps>, forwardedRef): React.JSX.Element => {
    const inputScope = useInputScope(__scopeNumberInput);
    const {
      inputRef,
      min,
      max,
      value,
      step,
      onChange,
      onIncrement,
      onDecrement,
      formatValue,
      parseValue,
      disabled,
      readOnly,
    } = useNumberInputContext(NUMBER_INPUT_ITEM_NAME, __scopeNumberInput);
    const composedNumberInputRef = useComposedRefs(forwardedRef, inputRef);

    const handleBlur = React.useCallback<React.FocusEventHandler<HTMLInputElement>>(
      (event) => {
        const numericValue = parseValue(event.target.value);
        const formattedValue = formatValue(numericValue);

        if (formattedValue !== event.target.value) {
          event.target.value = formattedValue;
        }

        onChange(numericValue);
      },
      [formatValue, onChange, parseValue],
    );

    const handleKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
      (event) => {
        switch (event.key) {
          case 'ArrowUp':
          case 'PageUp':
            onIncrement();
            event.preventDefault();
            break;
          case 'ArrowDown':
          case 'PageDown':
            onDecrement();
            event.preventDefault();
            break;

          default:
            break;
        }
      },
      [onIncrement, onDecrement],
    );

    const handleKeyDownPrevent = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>((event) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'PageUp':
        case 'PageDown':
        case 'Tab':
        case 'Escape':
        case 'Enter':
        case 'Backspace':
        case 'Delete':
        case 'Home':
        case 'End':
        case '.':
        case ',':
        case '-':
        case '%':
          return;

        default:
          if (isNumberKey(event.key) || isModifierKey(event) || isFunctionKey(event.key)) {
            return;
          }

          event.preventDefault();
      }
    }, []);

    const handleKeyDownEnter = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
      (event) => {
        const inputElement = inputRef.current;

        if (event.key !== 'Enter' || !inputElement) {
          return;
        }

        const numericValue = parseValue(inputElement.value);
        const formattedValue = formatValue(numericValue);

        if (formattedValue !== inputElement.value) {
          inputElement.value = formattedValue;
        }

        onChange(numericValue);
      },
      [formatValue, inputRef, onChange, parseValue],
    );

    React.useEffect(() => {
      const handleWheel = (event: WheelEvent): void => {
        const inputElement = inputRef.current;

        if (!inputElement || disabled || readOnly || document.activeElement !== inputElement) {
          return;
        }

        event.preventDefault();
        event.deltaY > 0 ? onIncrement() : onDecrement();
      };

      const inputElement = inputRef.current;

      if (inputElement) {
        inputElement.addEventListener('wheel', handleWheel);
      }

      return () => {
        if (inputElement) {
          inputElement.removeEventListener('wheel', handleWheel);
        }
      };
    }, [onIncrement, onDecrement, inputRef, disabled, readOnly]);

    React.useEffect(() => {
      const inputElement = inputRef.current;

      if (inputElement && inputElement !== document.activeElement) {
        inputElement.value = formatValue(value);
      }
    }, [formatValue, inputRef, value]);

    return (
      <InputPrimitive.Item
        ref={composedNumberInputRef}
        {...inputScope}
        {...props}
        defaultValue={formatValue(value)}
        disabled={disabled}
        max={max}
        min={min}
        readOnly={readOnly}
        step={step}
        onBlur={composeEventHandlers(props.onBlur, handleBlur)}
        onKeyDown={composeEventHandlers(
          props.onKeyDown,
          React.useMemo(
            () => chain(handleKeyDownPrevent, handleKeyDown, handleKeyDownEnter),
            [handleKeyDown, handleKeyDownEnter, handleKeyDownPrevent],
          ),
        )}
      />
    );
  },
);

NumberInputItem.displayName = NUMBER_INPUT_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Component: NumberInputImplButton
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_BUTTON_IMPL_NAME = 'NumberInputImplButton';

type NumberInputButtonImplElement = React.ElementRef<typeof Primitive.button>;
interface NumberInputButtonImplProps extends React.ComponentPropsWithoutRef<typeof Primitive.button> {
  operation: 'increment' | 'decrement';
}

const NumberInputButtonImpl = React.forwardRef<NumberInputButtonImplElement, NumberInputButtonImplProps>(
  (
    { __scopeNumberInput, operation, ...props }: ScopedProps<NumberInputButtonImplProps>,
    forwardedRef,
  ): React.JSX.Element => {
    const { ariaIncrementLabel, ariaDecrementLabel, onIncrement, onDecrement, disabled, readOnly } =
      useNumberInputContext(NUMBER_INPUT_BUTTON_IMPL_NAME, __scopeNumberInput);
    const timeoutIdRef = React.useRef<NodeJS.Timeout | null>(null);

    const startActionInterval = React.useCallback((callback: () => void) => {
      const interval = 100;

      const repeatAction = (): void => {
        callback();
        timeoutIdRef.current = setTimeout(repeatAction, interval);
      };

      callback();
      timeoutIdRef.current = setTimeout(repeatAction, interval * 2);
    }, []);

    const handlePointerDown = React.useCallback(() => {
      const action = operation === 'increment' ? onIncrement : onDecrement;

      startActionInterval(action);
    }, [onDecrement, onIncrement, operation, startActionInterval]);

    const handlePointerUp = React.useCallback(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    }, []);

    return (
      <Primitive.button
        ref={forwardedRef}
        aria-label={operation === 'increment' ? ariaIncrementLabel : ariaDecrementLabel}
        aria-live="polite"
        disabled={disabled || readOnly}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerUp}
        onPointerUp={handlePointerUp}
        {...props}
      />
    );
  },
);

NumberInputButtonImpl.displayName = NUMBER_INPUT_BUTTON_IMPL_NAME;

/* -----------------------------------------------------------------------------
 * Component: NumberInputIncrementButton
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_INCREMENT_BUTTON_NAME = 'NumberInputIncrementButton';

type NumberInputIncrementButtonElement = NumberInputButtonImplElement;
type NumberInputIncrementButtonProps = Omit<NumberInputButtonImplProps, 'operation'>;

const NumberInputIncrementButton = React.forwardRef<NumberInputIncrementButtonElement, NumberInputIncrementButtonProps>(
  (props: NumberInputIncrementButtonProps, forwardedRef): React.JSX.Element => (
    <NumberInputButtonImpl operation="increment" {...props} ref={forwardedRef} />
  ),
);

NumberInputIncrementButton.displayName = NUMBER_INPUT_INCREMENT_BUTTON_NAME;

/* -----------------------------------------------------------------------------
 * Component: NumberInputDecrementButton
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_DECREMENT_BUTTON_NAME = 'NumberInputDecrementButton';

type NumberInputDecrementButtonElement = NumberInputButtonImplElement;
type NumberInputDecrementButtonProps = Omit<NumberInputButtonImplProps, 'operation'>;

const NumberInputDecrementButton = React.forwardRef<NumberInputDecrementButtonElement, NumberInputDecrementButtonProps>(
  (props: NumberInputDecrementButtonProps, forwardedRef): React.JSX.Element => (
    <NumberInputButtonImpl operation="decrement" {...props} ref={forwardedRef} />
  ),
);

NumberInputDecrementButton.displayName = NUMBER_INPUT_DECREMENT_BUTTON_NAME;

/* -----------------------------------------------------------------------------
 * Utils
 * -------------------------------------------------------------------------- */

function chain<T extends unknown[]>(...callbacks: ((...args: T) => void)[]): (...args: T) => void {
  return (...args: T) => {
    for (const callback of callbacks) {
      callback(...args);
    }
  };
}

function getNumberFormatSeparators(locale: string): { decimalSeparator: string; thousandSeparator: string } {
  const numberFormat = new Intl.NumberFormat(locale);
  const parts = numberFormat.formatToParts(12345.6);

  let thousandSeparator = '';
  let decimalSeparator = '';

  for (const part of parts) {
    if (part.type === 'group') {
      thousandSeparator = part.value;
    } else if (part.type === 'decimal') {
      decimalSeparator = part.value;
    }
  }

  return { thousandSeparator, decimalSeparator };
}

function normalizeInputValue(value: string, thousandSeparator: string, decimalSeparator: string): string {
  return value
    .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
    .replace(new RegExp(`\\${decimalSeparator}`), '.')
    .replace(/[()]/g, '-');
}

function isModifierKey(event: React.KeyboardEvent<HTMLInputElement>): boolean {
  return event.ctrlKey || event.altKey || event.metaKey;
}

function isFunctionKey(key: string): boolean {
  return key.startsWith('F') && key.length > 1;
}

function isNumberKey(key: string): boolean {
  return !isNaN(Number(key));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createNumberInputScope,
  NumberInput,
  NumberInput as Root,
  NumberInputItem,
  NumberInputItem as Item,
  NumberInputIncrementButton,
  NumberInputIncrementButton as IncrementButton,
  NumberInputDecrementButton,
  NumberInputDecrementButton as DecrementButton,
  type NumberInputProps,
  type NumberInputItemProps,
  type NumberInputIncrementButtonProps,
  type NumberInputDecrementButtonProps,
};
