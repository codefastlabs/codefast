import type { Scope } from '@radix-ui/react-context';
import type {
  ComponentProps,
  FocusEventHandler,
  JSX,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  RefObject,
} from 'react';

import * as InputPrimitive from '@codefast-ui/input';
import { createInputScope } from '@codefast-ui/input';
import { composeEventHandlers } from '@radix-ui/primitive';
import { createContextScope } from '@radix-ui/react-context';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { useCallback, useEffect, useMemo, useRef } from 'react';

/* -----------------------------------------------------------------------------
 * Context: InputNumber
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_NAME = 'InputNumber';

type ScopedProps<P> = P & { __scopeInputNumber?: Scope };
const [createInputNumberContext, createInputNumberScope] = createContextScope(NUMBER_INPUT_NAME, [createInputScope]);
const useInputScope = createInputScope();

interface InputNumberContextValue {
  formatOptions: Intl.NumberFormatOptions;
  formatValue: (value?: number) => string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value?: number) => void;
  onDecrement: () => void;
  onDecrementToMin: () => void;
  onIncrement: () => void;
  onIncrementToMax: () => void;
  parseValue: (value: number | readonly string[] | string | undefined) => number;
  ariaDecrementLabel?: string;
  ariaIncrementLabel?: string;
  disabled?: boolean;
  id?: string;
  max?: number;
  min?: number;
  readOnly?: boolean;
  step?: number;
  value?: number;
}

const [InputNumberProvider, useInputNumberContext] =
  createInputNumberContext<InputNumberContextValue>(NUMBER_INPUT_NAME);

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

function InputNumber(
  numberInputProps: ScopedProps<
    ComponentProps<typeof InputPrimitive.Root> & {
      ariaDecrementLabel?: string;
      ariaIncrementLabel?: string;
      defaultValue?: number;
      formatOptions?: Intl.NumberFormatOptions;
      id?: string;
      locale?: string;
      max?: number;
      min?: number;
      onChange?: (value: number) => void;
      step?: number;
      value?: number;
    }
  >,
): JSX.Element {
  const {
    __scopeInputNumber,
    id,
    ariaDecrementLabel,
    ariaIncrementLabel,
    defaultValue,
    formatOptions = { minimumFractionDigits: 0, style: 'decimal' },
    locale,
    max,
    min,
    onChange,
    step = 1,
    value: valueProp,
    ...props
  } = numberInputProps;
  const inputScope = useInputScope(__scopeInputNumber);
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useControllableState({
    defaultProp: defaultValue,
    onChange,
    prop: valueProp,
  });

  const { decimalSeparator, thousandSeparator } = useMemo(() => getNumberFormatSeparators(locale), [locale]);

  const formatValue = useCallback(
    (inputValue?: number): string => {
      if (inputValue === undefined || Number.isNaN(inputValue)) {
        return '';
      }

      return new Intl.NumberFormat(locale, formatOptions).format(inputValue);
    },
    [formatOptions, locale],
  );

  const parseValue = useCallback(
    (inputValue: number | readonly string[] | string | undefined): number => {
      if (typeof inputValue === 'number') {
        return clamp(inputValue, min, max);
      }

      if (typeof inputValue !== 'string') {
        return Number.NaN;
      }

      const cleanedValue = inputValue.trim().replaceAll(/[^\d.,\-()]/g, '');

      if (cleanedValue === '') {
        return Number.NaN;
      }

      const normalizedValue = normalizeInputValue(cleanedValue, thousandSeparator, decimalSeparator);
      let parsedValue = Number.parseFloat(normalizedValue);

      if (formatOptions.style === 'percent') {
        parsedValue /= 100;
      }

      return Number.isNaN(parsedValue) ? 0 : clamp(parsedValue, min, max);
    },
    [decimalSeparator, formatOptions.style, max, min, thousandSeparator],
  );

  const changeNumberValue = useCallback(
    (operation: (number: number) => number) => {
      const inputElement = inputRef.current;

      if (!inputElement || props.disabled || props.readOnly) {
        return;
      }

      const currentValue = parseValue(inputElement.value) || 0;
      const newValue = clamp(operation(currentValue), min, max);

      inputElement.value = formatValue(newValue);
      setValue(newValue);
    },
    [props.disabled, formatValue, max, min, parseValue, props.readOnly, setValue],
  );

  const handleIncrement = useCallback(() => {
    changeNumberValue((number) => number + step);
  }, [changeNumberValue, step]);

  const handleDecrement = useCallback(() => {
    changeNumberValue((number) => number - step);
  }, [changeNumberValue, step]);

  const handleIncrementToMax = useCallback(() => {
    changeNumberValue((number) => max ?? number + step);
  }, [changeNumberValue, max, step]);

  const handleDecrementToMin = useCallback(() => {
    changeNumberValue((number) => min ?? number - step);
  }, [changeNumberValue, min, step]);

  return (
    <InputNumberProvider
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      disabled={props.disabled}
      formatOptions={formatOptions}
      formatValue={formatValue}
      id={id}
      inputRef={inputRef}
      max={max}
      min={min}
      parseValue={parseValue}
      readOnly={props.readOnly}
      scope={__scopeInputNumber}
      value={value}
      onChange={setValue}
      onDecrement={handleDecrement}
      onDecrementToMin={handleDecrementToMin}
      onIncrement={handleIncrement}
      onIncrementToMax={handleIncrementToMax}
    >
      <InputPrimitive.Root {...inputScope} {...props} />
    </InputNumberProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberItem
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_ITEM_NAME = 'InputNumberItem';

function InputNumberItem({
  __scopeInputNumber,
  onBlur,
  onKeyDown,
  ...props
}: ScopedProps<
  Omit<
    ComponentProps<typeof InputPrimitive.Item>,
    'defaultValue' | 'disabled' | 'id' | 'max' | 'min' | 'onChange' | 'prefix' | 'readOnly' | 'step' | 'value'
  >
>): JSX.Element {
  const inputScope = useInputScope(__scopeInputNumber);
  const {
    id,
    disabled,
    formatValue,
    inputRef,
    max,
    min,
    onChange,
    onDecrement,
    onDecrementToMin,
    onIncrement,
    onIncrementToMax,
    parseValue,
    readOnly,
    step,
    value,
  } = useInputNumberContext(NUMBER_INPUT_ITEM_NAME, __scopeInputNumber);

  // Handle blur event to format the value
  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
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

  // Handle keyboard events to increment/decrement the value
  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      switch (event.key) {
        case 'ArrowUp': {
          onIncrement();
          event.preventDefault();
          break;
        }

        case 'PageUp': {
          onIncrementToMax();
          event.preventDefault();
          break;
        }

        case 'ArrowDown': {
          onDecrement();
          event.preventDefault();
          break;
        }

        case 'PageDown': {
          onDecrementToMin();
          event.preventDefault();
          break;
        }

        default: {
          break;
        }
      }
    },
    [onIncrement, onIncrementToMax, onDecrement, onDecrementToMin],
  );

  // Prevent non-numeric input
  const handleKeyDownPrevent = useCallback<KeyboardEventHandler<HTMLInputElement>>((event) => {
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

      case '%': {
        return;
      }

      default: {
        if (isNumberKey(event.key) || isModifierKey(event) || isFunctionKey(event.key)) {
          return;
        }

        event.preventDefault();
      }
    }
  }, []);

  // Handle the Enter key to format the value
  const handleKeyDownEnter = useCallback<KeyboardEventHandler<HTMLInputElement>>(
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

  // Handle wheel event to increment/decrement the value
  useEffect(() => {
    const handleWheel = (event: WheelEvent): void => {
      const inputElement = inputRef.current;

      if (!inputElement || disabled || readOnly || document.activeElement !== inputElement) {
        return;
      }

      event.preventDefault();

      if (event.deltaY > 0) {
        onIncrement();
      } else {
        onDecrement();
      }
    };

    const inputElement = inputRef.current;

    inputElement?.addEventListener('wheel', handleWheel);

    return () => {
      inputElement?.removeEventListener('wheel', handleWheel);
    };
  }, [onIncrement, onDecrement, inputRef, disabled, readOnly]);

  // Format the value when the value changes
  useEffect(() => {
    const inputElement = inputRef.current;

    if (inputElement && inputElement !== document.activeElement) {
      inputElement.value = formatValue(value);
    }
  }, [formatValue, inputRef, value]);

  // Handle form reset
  useEffect(() => {
    const inputElement = inputRef.current;

    if (!inputElement) {
      return;
    }

    const handleReset = (): void => {
      onChange();
    };

    const form = inputElement.form;

    form?.addEventListener('reset', handleReset);

    return () => {
      form?.removeEventListener('reset', handleReset);
    };
  }, [inputRef, onChange]);

  return (
    <InputPrimitive.Item
      ref={inputRef}
      defaultValue={formatValue(value)}
      disabled={disabled}
      id={id}
      inputMode="decimal"
      max={max}
      min={min}
      readOnly={readOnly}
      step={step}
      onBlur={composeEventHandlers(onBlur, handleBlur)}
      onKeyDown={composeEventHandlers(
        onKeyDown,
        useMemo(
          () => chain(handleKeyDownPrevent, handleKeyDown, handleKeyDownEnter),
          [handleKeyDown, handleKeyDownEnter, handleKeyDownPrevent],
        ),
      )}
      {...inputScope}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NumberStepperButton
 * -------------------------------------------------------------------------- */

const NUMBER_STEPPER_BUTTON_NAME = 'NumberStepperButton';

function NumberStepperButton({
  __scopeInputNumber,
  operation,
  ...props
}: ScopedProps<
  ComponentProps<'button'> & {
    operation: 'decrement' | 'increment';
  }
>): JSX.Element {
  const { id, ariaDecrementLabel, ariaIncrementLabel, disabled, onDecrement, onIncrement } = useInputNumberContext(
    NUMBER_STEPPER_BUTTON_NAME,
    __scopeInputNumber,
  );
  const timeoutIdRef = useRef<null | number>(null);

  const startActionInterval = useCallback((callback: () => void) => {
    const interval = 100;

    const repeatAction = (): void => {
      callback();
      timeoutIdRef.current = setTimeout(repeatAction, interval);
    };

    callback();
    timeoutIdRef.current = setTimeout(repeatAction, interval * 2);
  }, []);

  const clearActionInterval = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback<PointerEventHandler<HTMLButtonElement>>(() => {
    const action = operation === 'increment' ? onIncrement : onDecrement;

    startActionInterval(action);
  }, [onDecrement, onIncrement, operation, startActionInterval]);

  const handleContextMenu = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => {
    event.preventDefault();
  }, []);

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLButtonElement>>(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();

        const action = operation === 'increment' ? onIncrement : onDecrement;

        action();
      }
    },
    [onDecrement, onIncrement, operation],
  );

  return (
    <button
      aria-controls={id}
      aria-label={operation === 'increment' ? ariaIncrementLabel : ariaDecrementLabel}
      aria-live="polite"
      disabled={disabled}
      type="button"
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onPointerCancel={clearActionInterval}
      onPointerDown={handlePointerDown}
      onPointerLeave={clearActionInterval}
      onPointerUp={clearActionInterval}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberIncrementButton
 * -------------------------------------------------------------------------- */

function InputNumberIncrementButton(
  props: Omit<
    ComponentProps<'button'> & {
      operation: 'decrement' | 'increment';
    },
    'operation'
  >,
): JSX.Element {
  return <NumberStepperButton operation="increment" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberDecrementButton
 * -------------------------------------------------------------------------- */

function InputNumberDecrementButton(
  props: Omit<
    ComponentProps<'button'> & {
      operation: 'decrement' | 'increment';
    },
    'operation'
  >,
): JSX.Element {
  return <NumberStepperButton operation="decrement" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Utility Functions
 * -------------------------------------------------------------------------- */

function chain<T extends unknown[]>(...callbacks: ((...args: T) => void)[]): (...args: T) => void {
  return (...args: T) => {
    for (const callback of callbacks) {
      callback(...args);
    }
  };
}

function getNumberFormatSeparators(locale?: string): {
  decimalSeparator: string;
  thousandSeparator: string;
} {
  const numberFormat = new Intl.NumberFormat(locale);
  const parts = numberFormat.formatToParts(12_345.6);

  let thousandSeparator = '';
  let decimalSeparator = '';

  for (const part of parts) {
    if (part.type === 'group') {
      thousandSeparator = part.value;
    }

    if (part.type === 'decimal') {
      decimalSeparator = part.value;
    }

    // Stop early if you've found enough.
    if (thousandSeparator && decimalSeparator) {
      break;
    }
  }

  return { decimalSeparator, thousandSeparator };
}

function normalizeInputValue(value: string, thousandSeparator: string, decimalSeparator: string): string {
  return value
    .replaceAll(new RegExp(`\\${thousandSeparator}`, 'g'), '')
    .replace(new RegExp(`\\${decimalSeparator}`), '.')
    .replaceAll(/[()]/g, '-');
}

function isModifierKey(event: KeyboardEvent<HTMLInputElement>): boolean {
  return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
}

function isFunctionKey(key: string): boolean {
  return key.startsWith('F') && key.length > 1;
}

function isNumberKey(key: string): boolean {
  return !Number.isNaN(Number(key));
}

function clamp(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(Math.max(value, min), max);
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createInputNumberScope,
  InputNumberDecrementButton as DecrementButton,
  InputNumberIncrementButton as IncrementButton,
  InputNumber,
  InputNumberDecrementButton,
  InputNumberIncrementButton,
  InputNumberItem,
  InputNumberItem as Item,
  InputNumber as Root,
};
