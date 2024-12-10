import * as InputPrimitive from '@codefast-ui/input';
import { createInputScope } from '@codefast-ui/input';
import { composeEventHandlers } from '@radix-ui/primitive';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import {
  type ButtonHTMLAttributes,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type FocusEventHandler,
  forwardRef,
  type JSX,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type PointerEventHandler,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

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
  formatValue: (value?: number) => string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value?: number) => void;
  onDecrement: () => void;
  onDecrementToMin: () => void;
  onIncrement: () => void;
  onIncrementToMax: () => void;
  parseValue: (value: string | number | readonly string[] | undefined) => number;
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

const [NumberInputProvider, useNumberInputContext] =
  createNumberInputContext<NumberInputContextValue>(NUMBER_INPUT_NAME);

interface NumberInputProps extends ComponentProps<typeof InputPrimitive.Root> {
  ariaDecrementLabel?: string;
  ariaIncrementLabel?: string;
  defaultValue?: number;
  disabled?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  id?: string;
  locale?: string;
  max?: number;
  min?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  step?: number;
  value?: number;
}

function NumberInput(numberInputProps: NumberInputProps): JSX.Element {
  const {
    __scopeNumberInput,
    id,
    ariaDecrementLabel,
    ariaIncrementLabel,
    defaultValue,
    disabled,
    formatOptions = { minimumFractionDigits: 0, style: 'decimal' },
    locale = navigator.language,
    max,
    min,
    onChange,
    readOnly,
    step = 1,
    value: valueProp,
    ...props
  } = numberInputProps as ScopedProps<NumberInputProps>;
  const inputScope = useInputScope(__scopeNumberInput);
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
    (inputValue: string | number | readonly string[] | undefined): number => {
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

      if (!inputElement || disabled || readOnly) {
        return;
      }

      const currentValue = parseValue(inputElement.value) || 0;
      const newValue = clamp(operation(currentValue), min, max);

      inputElement.value = formatValue(newValue);
      setValue(newValue);
    },
    [disabled, formatValue, max, min, parseValue, readOnly, setValue],
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
    <NumberInputProvider
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      disabled={disabled}
      formatOptions={formatOptions}
      formatValue={formatValue}
      id={id}
      inputRef={inputRef}
      max={max}
      min={min}
      parseValue={parseValue}
      readOnly={readOnly}
      scope={__scopeNumberInput}
      value={value}
      onChange={setValue}
      onDecrement={handleDecrement}
      onDecrementToMin={handleDecrementToMin}
      onIncrement={handleIncrement}
      onIncrementToMax={handleIncrementToMax}
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

type NumberInputItemElement = ComponentRef<typeof InputPrimitive.Item>;
type NumberInputItemProps = Omit<
  ComponentPropsWithoutRef<typeof InputPrimitive.Item>,
  'defaultValue' | 'disabled' | 'id' | 'max' | 'min' | 'onChange' | 'prefix' | 'readOnly' | 'step' | 'value'
>;

const NumberInputItem = forwardRef<NumberInputItemElement, NumberInputItemProps>(
  (
    { __scopeNumberInput, onBlur, onKeyDown, ...props }: ScopedProps<NumberInputItemProps>,
    forwardedRef,
  ): JSX.Element => {
    const inputScope = useInputScope(__scopeNumberInput);
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
    } = useNumberInputContext(NUMBER_INPUT_ITEM_NAME, __scopeNumberInput);
    const composedNumberInputRef = useComposedRefs(forwardedRef, inputRef);

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

    // Handle Enter key to format the value
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
        ref={composedNumberInputRef}
        defaultValue={formatValue(value)}
        disabled={disabled}
        id={id}
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
  },
);

NumberInputItem.displayName = NUMBER_INPUT_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Component: NumberInputImplButton
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_BUTTON_IMPL_NAME = 'NumberInputImplButton';

type NumberInputButtonImplElement = HTMLButtonElement;
interface NumberInputButtonImplProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  operation: 'increment' | 'decrement';
}

const NumberInputButtonImpl = forwardRef<NumberInputButtonImplElement, NumberInputButtonImplProps>(
  ({ __scopeNumberInput, operation, ...props }: ScopedProps<NumberInputButtonImplProps>, forwardedRef): JSX.Element => {
    const { id, ariaDecrementLabel, ariaIncrementLabel, disabled, onDecrement, onIncrement, readOnly } =
      useNumberInputContext(NUMBER_INPUT_BUTTON_IMPL_NAME, __scopeNumberInput);
    const timeoutIdRef = useRef<number | null>(null);

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

    return (
      <button
        ref={forwardedRef}
        aria-controls={id}
        aria-label={operation === 'increment' ? ariaIncrementLabel : ariaDecrementLabel}
        aria-live="polite"
        disabled={disabled || readOnly}
        tabIndex={-1}
        type="button"
        onContextMenu={handleContextMenu}
        onPointerCancel={clearActionInterval}
        onPointerDown={handlePointerDown}
        onPointerLeave={clearActionInterval}
        onPointerUp={clearActionInterval}
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

const NumberInputIncrementButton = forwardRef<NumberInputIncrementButtonElement, NumberInputIncrementButtonProps>(
  (props: NumberInputIncrementButtonProps, forwardedRef): JSX.Element => (
    <NumberInputButtonImpl ref={forwardedRef} operation="increment" {...props} />
  ),
);

NumberInputIncrementButton.displayName = NUMBER_INPUT_INCREMENT_BUTTON_NAME;

/* -----------------------------------------------------------------------------
 * Component: NumberInputDecrementButton
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_DECREMENT_BUTTON_NAME = 'NumberInputDecrementButton';

type NumberInputDecrementButtonElement = NumberInputButtonImplElement;
type NumberInputDecrementButtonProps = Omit<NumberInputButtonImplProps, 'operation'>;

const NumberInputDecrementButton = forwardRef<NumberInputDecrementButtonElement, NumberInputDecrementButtonProps>(
  (props: NumberInputDecrementButtonProps, forwardedRef): JSX.Element => (
    <NumberInputButtonImpl ref={forwardedRef} operation="decrement" {...props} />
  ),
);

NumberInputDecrementButton.displayName = NUMBER_INPUT_DECREMENT_BUTTON_NAME;

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

function getNumberFormatSeparators(locale: string): {
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
  createNumberInputScope,
  NumberInputDecrementButton as DecrementButton,
  NumberInputIncrementButton as IncrementButton,
  NumberInputItem as Item,
  NumberInput,
  NumberInputDecrementButton,
  NumberInputIncrementButton,
  NumberInputItem,
  NumberInput as Root,
  type NumberInputDecrementButtonProps,
  type NumberInputIncrementButtonProps,
  type NumberInputItemProps,
  type NumberInputProps,
};
