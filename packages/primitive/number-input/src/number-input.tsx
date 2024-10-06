import * as React from 'react';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { composeEventHandlers } from '@radix-ui/primitive';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import * as InputPrimitive from '@codefast-ui/input';
import { createInputScope } from '@codefast-ui/input';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_NAME = 'NumberInput';

type ScopedProps<P> = P & {
  __scopeNumberInput?: Scope;
};
const [createNumberInputContext, createNumberInputScope] = createContextScope(
  NUMBER_INPUT_NAME,
  [createInputScope],
);
const useInputScope = createInputScope();

interface NumberInputContextValue {
  formatOptions: Intl.NumberFormatOptions;
  formatValue: (value?: number) => string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value?: number) => void;
  onDecrement: () => void;
  onDecrementToMin: () => void;
  onIncrement: () => void;
  onIncrementToMax: () => void;
  parseValue: (
    value: string | number | readonly string[] | undefined,
  ) => number;
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

interface NumberInputProps
  extends React.ComponentProps<typeof InputPrimitive.Root> {
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

function NumberInput(numberInputProps: NumberInputProps): React.JSX.Element {
  const {
    __scopeNumberInput,
    ariaDecrementLabel,
    ariaIncrementLabel,
    defaultValue,
    disabled,
    formatOptions = { style: 'decimal', minimumFractionDigits: 0 },
    id,
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
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange,
  });

  const { thousandSeparator, decimalSeparator } = React.useMemo(
    () => getNumberFormatSeparators(locale),
    [locale],
  );

  const formatValue = React.useCallback(
    (inputValue?: number): string => {
      if (inputValue === undefined || isNaN(inputValue)) {
        return '';
      }

      return new Intl.NumberFormat(locale, formatOptions).format(inputValue);
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

      const normalizedValue = normalizeInputValue(
        cleanedValue,
        thousandSeparator,
        decimalSeparator,
      );
      let parsedValue = parseFloat(normalizedValue);

      if (formatOptions.style === 'percent') {
        parsedValue /= 100;
      }

      return isNaN(parsedValue) ? 0 : clamp(parsedValue, min, max);
    },
    [decimalSeparator, formatOptions.style, max, min, thousandSeparator],
  );

  const changeNumberValue = React.useCallback(
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

  const handleIncrement = React.useCallback(() => {
    changeNumberValue((number) => number + step);
  }, [changeNumberValue, step]);

  const handleDecrement = React.useCallback(() => {
    changeNumberValue((number) => number - step);
  }, [changeNumberValue, step]);

  const handleIncrementToMax = React.useCallback(() => {
    changeNumberValue((number) => max ?? number + step);
  }, [changeNumberValue, max, step]);

  const handleDecrementToMin = React.useCallback(() => {
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

type NumberInputItemElement = React.ComponentRef<typeof InputPrimitive.Item>;
type NumberInputItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>,
  | 'defaultValue'
  | 'disabled'
  | 'id'
  | 'max'
  | 'min'
  | 'onChange'
  | 'prefix'
  | 'readOnly'
  | 'step'
  | 'value'
>;

const NumberInputItem = React.forwardRef<
  NumberInputItemElement,
  NumberInputItemProps
>(
  (
    {
      __scopeNumberInput,
      onBlur,
      onKeyDown,
      ...props
    }: ScopedProps<NumberInputItemProps>,
    forwardedRef,
  ): React.JSX.Element => {
    const inputScope = useInputScope(__scopeNumberInput);
    const {
      disabled,
      formatValue,
      id,
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
    const handleBlur = React.useCallback<
      React.FocusEventHandler<HTMLInputElement>
    >(
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
    const handleKeyDown = React.useCallback<
      React.KeyboardEventHandler<HTMLInputElement>
    >(
      (event) => {
        switch (event.key) {
          case 'ArrowUp':
            onIncrement();
            event.preventDefault();
            break;

          case 'PageUp':
            onIncrementToMax();
            event.preventDefault();
            break;

          case 'ArrowDown':
            onDecrement();
            event.preventDefault();
            break;

          case 'PageDown':
            onDecrementToMin();
            event.preventDefault();
            break;

          default:
            break;
        }
      },
      [onIncrement, onIncrementToMax, onDecrement, onDecrementToMin],
    );

    // Prevent non-numeric input
    const handleKeyDownPrevent = React.useCallback<
      React.KeyboardEventHandler<HTMLInputElement>
    >((event) => {
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
          if (
            isNumberKey(event.key) ||
            isModifierKey(event) ||
            isFunctionKey(event.key)
          ) {
            return;
          }

          event.preventDefault();
      }
    }, []);

    // Handle Enter key to format the value
    const handleKeyDownEnter = React.useCallback<
      React.KeyboardEventHandler<HTMLInputElement>
    >(
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
    React.useEffect(() => {
      const handleWheel = (event: WheelEvent): void => {
        const inputElement = inputRef.current;

        if (
          !inputElement ||
          disabled ||
          readOnly ||
          document.activeElement !== inputElement
        ) {
          return;
        }

        event.preventDefault();
        event.deltaY > 0 ? onIncrement() : onDecrement();
      };

      const inputElement = inputRef.current;

      inputElement?.addEventListener('wheel', handleWheel);

      return () => {
        inputElement?.removeEventListener('wheel', handleWheel);
      };
    }, [onIncrement, onDecrement, inputRef, disabled, readOnly]);

    // Format the value when the value changes
    React.useEffect(() => {
      const inputElement = inputRef.current;

      if (inputElement && inputElement !== document.activeElement) {
        inputElement.value = formatValue(value);
      }
    }, [formatValue, inputRef, value]);

    // Handle form reset
    React.useEffect(() => {
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
          React.useMemo(
            () =>
              chain(handleKeyDownPrevent, handleKeyDown, handleKeyDownEnter),
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
interface NumberInputButtonImplProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  operation: 'increment' | 'decrement';
}

const NumberInputButtonImpl = React.forwardRef<
  NumberInputButtonImplElement,
  NumberInputButtonImplProps
>(
  (
    {
      __scopeNumberInput,
      operation,
      ...props
    }: ScopedProps<NumberInputButtonImplProps>,
    forwardedRef,
  ): React.JSX.Element => {
    const {
      ariaIncrementLabel,
      ariaDecrementLabel,
      disabled,
      readOnly,
      id,
      onIncrement,
      onDecrement,
    } = useNumberInputContext(
      NUMBER_INPUT_BUTTON_IMPL_NAME,
      __scopeNumberInput,
    );
    const timeoutIdRef = React.useRef<number | null>(null);

    const startActionInterval = React.useCallback((callback: () => void) => {
      const interval = 100;

      const repeatAction = (): void => {
        callback();
        timeoutIdRef.current = setTimeout(repeatAction, interval);
      };

      callback();
      timeoutIdRef.current = setTimeout(repeatAction, interval * 2);
    }, []);

    const clearActionInterval = React.useCallback(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    }, []);

    const handlePointerDown = React.useCallback<
      React.PointerEventHandler<HTMLButtonElement>
    >(() => {
      const action = operation === 'increment' ? onIncrement : onDecrement;

      startActionInterval(action);
    }, [onDecrement, onIncrement, operation, startActionInterval]);

    const handleContextMenu = React.useCallback<
      React.MouseEventHandler<HTMLButtonElement>
    >((event) => {
      event.preventDefault();
    }, []);

    return (
      <button
        ref={forwardedRef}
        aria-controls={id}
        aria-label={
          operation === 'increment' ? ariaIncrementLabel : ariaDecrementLabel
        }
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
type NumberInputIncrementButtonProps = Omit<
  NumberInputButtonImplProps,
  'operation'
>;

const NumberInputIncrementButton = React.forwardRef<
  NumberInputIncrementButtonElement,
  NumberInputIncrementButtonProps
>(
  (props: NumberInputIncrementButtonProps, forwardedRef): React.JSX.Element => (
    <NumberInputButtonImpl
      operation="increment"
      {...props}
      ref={forwardedRef}
    />
  ),
);

NumberInputIncrementButton.displayName = NUMBER_INPUT_INCREMENT_BUTTON_NAME;

/* -----------------------------------------------------------------------------
 * Component: NumberInputDecrementButton
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_DECREMENT_BUTTON_NAME = 'NumberInputDecrementButton';

type NumberInputDecrementButtonElement = NumberInputButtonImplElement;
type NumberInputDecrementButtonProps = Omit<
  NumberInputButtonImplProps,
  'operation'
>;

const NumberInputDecrementButton = React.forwardRef<
  NumberInputDecrementButtonElement,
  NumberInputDecrementButtonProps
>(
  (props: NumberInputDecrementButtonProps, forwardedRef): React.JSX.Element => (
    <NumberInputButtonImpl
      operation="decrement"
      {...props}
      ref={forwardedRef}
    />
  ),
);

NumberInputDecrementButton.displayName = NUMBER_INPUT_DECREMENT_BUTTON_NAME;

/* -----------------------------------------------------------------------------
 * Utility Functions
 * -------------------------------------------------------------------------- */

function chain<T extends unknown[]>(
  ...callbacks: ((...args: T) => void)[]
): (...args: T) => void {
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
  const parts = numberFormat.formatToParts(12345.6);

  return parts.reduce(
    (separatorOptions, part) => {
      if (part.type === 'group') {
        separatorOptions.thousandSeparator = part.value;
      }

      if (part.type === 'decimal') {
        separatorOptions.decimalSeparator = part.value;
      }

      return separatorOptions;
    },
    { thousandSeparator: '', decimalSeparator: '' },
  );
}

function normalizeInputValue(
  value: string,
  thousandSeparator: string,
  decimalSeparator: string,
): string {
  return value
    .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
    .replace(new RegExp(`\\${decimalSeparator}`), '.')
    .replace(/[()]/g, '-');
}

function isModifierKey(event: React.KeyboardEvent<HTMLInputElement>): boolean {
  return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
}

function isFunctionKey(key: string): boolean {
  return key.startsWith('F') && key.length > 1;
}

function isNumberKey(key: string): boolean {
  return !isNaN(Number(key));
}

function clamp(value: number, min = -Infinity, max = Infinity): number {
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
