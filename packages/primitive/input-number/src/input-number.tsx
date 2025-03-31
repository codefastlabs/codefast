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

/**
 * The name of the InputNumber component constant.
 */
const NUMBER_INPUT_NAME = 'InputNumber';

/**
 * Props that include an optional scope for the InputNumber component.
 */
type ScopedProps<P> = P & {
  /** Optional scope for the InputNumber component context */
  __scopeInputNumber?: Scope;
};

const [createInputNumberContext, createInputNumberScope] = createContextScope(NUMBER_INPUT_NAME, [createInputScope]);
const useInputScope = createInputScope();

/**
 * Context value for the InputNumber component.
 */
interface InputNumberContextValue {
  /** Formatting options for displaying the number value */
  formatOptions: Intl.NumberFormatOptions;

  /** Function to format a number value as a string */
  formatValue: (value?: number) => string;

  /** Reference to the input element */
  inputRef: RefObject<HTMLInputElement | null>;

  /** Handler for when the value changes */
  onChange: (value?: number) => void;

  /** Handler to decrement the value */
  onDecrement: () => void;

  /** Handler to decrement the value to the minimum allowed */
  onDecrementToMin: () => void;

  /** Handler to increment the value */
  onIncrement: () => void;

  /** Handler to increment the value to the maximum allowed */
  onIncrementToMax: () => void;

  /** Function to parse a value into a number */
  parseValue: (value: number | readonly string[] | string | undefined) => number;

  /** Accessible label for the decrement button */
  ariaDecrementLabel?: string;

  /** Accessible label for the increment button */
  ariaIncrementLabel?: string;

  /** Initial value used when the input is uncontrolled */
  defaultValue?: number;

  /** Whether the input is disabled */
  disabled?: boolean;

  /** Unique identifier for the input */
  id?: string;

  /** Maximum allowed value */
  max?: number;

  /** Minimum allowed value */
  min?: number;

  /** Whether the input is read-only */
  readOnly?: boolean;

  /** Step value for increments/decrements */
  step?: number;

  /** Current value of the input */
  value?: number;
}

const [InputNumberProvider, useInputNumberContext] =
  createInputNumberContext<InputNumberContextValue>(NUMBER_INPUT_NAME);

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

/**
 * Props for the main InputNumber component.
 */
interface InputNumberProps extends ComponentProps<typeof InputPrimitive.Root> {
  /** Accessible label for the decrement button */
  ariaDecrementLabel?: string;

  /** Accessible label for the increment button */
  ariaIncrementLabel?: string;

  /** Initial value when uncontrolled */
  defaultValue?: number;

  /** Options for number formatting */
  formatOptions?: Intl.NumberFormatOptions;

  /** Unique identifier for the input */
  id?: string;

  /** Locale used for number formatting */
  locale?: string;

  /** Maximum allowed value */
  max?: number;

  /** Minimum allowed value */
  min?: number;

  /** Handler called when the value changes */
  onChange?: (value: number) => void;

  /** Step value for increments/decrements */
  step?: number;

  /** Current value when controlled */
  value?: number;
}

function InputNumber(numberInputProps: ScopedProps<InputNumberProps>): JSX.Element {
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

  /** Scope for the input component */
  const inputScope = useInputScope(__scopeInputNumber);

  /** Reference to the input element */
  const inputRef = useRef<HTMLInputElement>(null);

  /** Controlled or uncontrolled value state */
  const [value, setValue] = useControllableState({
    defaultProp: defaultValue,
    onChange,
    prop: valueProp,
  });

  /** Separators used for number formatting based on locale */
  const { decimalSeparator, thousandSeparator } = useMemo(() => getNumberFormatSeparators(locale), [locale]);

  /**
   * Formats a number value into a string representation
   * @param inputValue - The number to format
   * @returns A formatted string representation of the number
   */
  const formatValue = useCallback(
    (inputValue?: number): string => {
      if (inputValue === undefined || Number.isNaN(inputValue)) {
        return '';
      }

      return new Intl.NumberFormat(locale, formatOptions).format(inputValue);
    },
    [formatOptions, locale],
  );

  /**
   * Parses a string or number input into a normalized number value
   * @param inputValue - The value to parse
   * @returns The parsed number value, clamped between min and max
   */
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

  /**
   * Changes the current value based on a provided operation
   * @param operation - Function that takes the current value and returns a new value
   */
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

  /**
   * Increments the current value by the step amount
   */
  const handleIncrement = useCallback(() => {
    changeNumberValue((number) => number + step);
  }, [changeNumberValue, step]);

  /**
   * Decrements the current value by the step amount
   */
  const handleDecrement = useCallback(() => {
    changeNumberValue((number) => number - step);
  }, [changeNumberValue, step]);

  /**
   * Sets the value to the maximum allowed
   */
  const handleIncrementToMax = useCallback(() => {
    changeNumberValue((number) => max ?? number + step);
  }, [changeNumberValue, max, step]);

  /**
   * Sets the value to the minimum allowed
   */
  const handleDecrementToMin = useCallback(() => {
    changeNumberValue((number) => min ?? number - step);
  }, [changeNumberValue, min, step]);

  return (
    <InputNumberProvider
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      defaultValue={defaultValue}
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

/**
 * The name of the InputNumberItem component constant.
 */
const NUMBER_INPUT_ITEM_NAME = 'InputNumberItem';

/**
 * Defines the props for the `InputNumberItem` component.
 */
type InputNumberItemProps = Omit<
  ComponentProps<typeof InputPrimitive.Item>,
  'defaultValue' | 'disabled' | 'id' | 'max' | 'min' | 'onChange' | 'prefix' | 'readOnly' | 'step' | 'value'
>;

function InputNumberItem({
  __scopeInputNumber,
  onBlur,
  onKeyDown,
  ...props
}: ScopedProps<InputNumberItemProps>): JSX.Element {
  // Retrieve input number context and input scope
  const inputScope = useInputScope(__scopeInputNumber);
  const {
    defaultValue,
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
  } = useInputNumberContext(NUMBER_INPUT_ITEM_NAME, __scopeInputNumber);

  /**
   * Handles the blur event to format the value of the input.
   *
   * @param event - The blur event triggered when the input loses focus.
   */
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

  /**
   * Handles keydown events to increment, decrement, or perform other actions.
   *
   * @param event - The keyboard event triggered by key presses.
   */
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

  /**
   * Prevents invalid keyboard input for the numeric input field.
   *
   * @param event - The keyboard event to handle.
   */
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

  /**
   * Handles the Enter key to format the value of the input.
   *
   * @param event - The keyboard event triggered by pressing Enter.
   */
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

  /**
   * Creates a combined keydown event handler that processes keyboard events in sequence.
   *
   * The handler chain executes in the following order:
   * 1. User-provided onKeyDown handler (if any)
   * 2. handleKeyDownPrevent - Prevents non-numeric input
   * 3. handleKeyDown - Handles arrow keys and page up/down for value adjustments
   * 4. handleKeyDownEnter - Handles Enter key press to format and update the value
   *
   * @returns A composed event handler function for the onKeyDown event
   */
  const combinedKeyDownHandler = useCallback(
    () => composeEventHandlers(onKeyDown, chain(handleKeyDownPrevent, handleKeyDown, handleKeyDownEnter)),
    [onKeyDown, handleKeyDown, handleKeyDownEnter, handleKeyDownPrevent],
  );

  /**
   * Adds a listener to handle wheel events for incrementing or decrementing the value.
   */
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

  /**
   * Updates the input field's value when it changes in the context.
   */
  useEffect(() => {
    const inputElement = inputRef.current;

    if (inputElement && inputElement !== document.activeElement) {
      inputElement.value = formatValue(value);
    }
  }, [formatValue, inputRef, value]);

  /**
   * Adds a listener to handle form reset events by clearing the input value.
   */
  useEffect(() => {
    const inputElement = inputRef.current;

    if (!inputElement) {
      return;
    }

    const handleReset = (): void => {
      onChange(parseValue(defaultValue));
    };

    const form = inputElement.form;

    form?.addEventListener('reset', handleReset);

    return () => {
      form?.removeEventListener('reset', handleReset);
    };
  }, [defaultValue, inputRef, onChange, parseValue]);

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
      onKeyDown={combinedKeyDownHandler()}
      {...inputScope}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NumberStepperButton
 * -------------------------------------------------------------------------- */

/**
 * The name of the NumberStepperButton component constant.
 */
const NUMBER_STEPPER_BUTTON_NAME = 'NumberStepperButton';

/**
 * Props for the NumberStepperButton component.
 */
interface NumberStepperButtonProps extends ComponentProps<'button'> {
  /**
   * The operation to perform when the button is pressed.
   * - `'increment'`: Increases the value.
   * - `'decrement'`: Decreases the value.
   */
  operation: 'decrement' | 'increment';
}

function NumberStepperButton({
  __scopeInputNumber,
  operation,
  ...props
}: ScopedProps<NumberStepperButtonProps>): JSX.Element {
  // Destructures relevant context values for the button functionality.
  const { id, ariaDecrementLabel, ariaIncrementLabel, disabled, onDecrement, onIncrement, min, max, value } =
    useInputNumberContext(NUMBER_STEPPER_BUTTON_NAME, __scopeInputNumber);

  const isDisabled = useMemo(() => {
    const atMin = min !== undefined && value !== undefined && value <= min;
    const atMax = max !== undefined && value !== undefined && value >= max;

    return disabled || atMin || atMax;
  }, [min, max, value, disabled]);

  /**
   * Ref to store a timeout ID for managing repeated button actions.
   */
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout>>(null);

  /**
   * Starts a repeated action at a regular interval.
   * The action begins immediately and then continues with a delay.
   *
   * @param callback - The callback function to execute repeatedly.
   */
  const startActionInterval = useCallback((callback: () => void) => {
    // Time between repeated actions (in milliseconds).
    const interval = 100;

    // Function to perform the action and set the next interval.
    const repeatAction = (): void => {
      callback();
      timeoutIdRef.current = setTimeout(repeatAction, interval);
    };

    callback();
    timeoutIdRef.current = setTimeout(repeatAction, interval * 2);
  }, []);

  /**
   * Clears any ongoing action intervals.
   */
  const clearActionInterval = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  /**
   * Handles pointer down events and triggers the appropriate action
   * (`increment` or `decrement`).
   */
  const handlePointerDown = useCallback<PointerEventHandler<HTMLButtonElement>>(() => {
    const action = operation === 'increment' ? onIncrement : onDecrement;

    startActionInterval(action);
  }, [onDecrement, onIncrement, operation, startActionInterval]);

  /**
   * Prevents the context menu from displaying when the button is right-clicked.
   *
   * @param event - The mouse event triggered by the right-click.
   */
  const handleContextMenu = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => {
    event.preventDefault();
  }, []);

  /**
   * Handles keyboard events to support activation of the button using
   * keyboard navigation (Enter or Space).
   *
   * @param event - The keyboard event with the triggered key.
   */
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
      disabled={isDisabled}
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

type InputNumberIncrementButtonProps = Omit<ComponentProps<typeof NumberStepperButton>, 'operation'>;

function InputNumberIncrementButton(props: InputNumberIncrementButtonProps): JSX.Element {
  return <NumberStepperButton operation="increment" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberDecrementButton
 * -------------------------------------------------------------------------- */

type InputNumberDecrementButtonProps = Omit<ComponentProps<typeof NumberStepperButton>, 'operation'>;

function InputNumberDecrementButton(props: InputNumberDecrementButtonProps): JSX.Element {
  return <NumberStepperButton operation="decrement" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Utility Functions
 * -------------------------------------------------------------------------- */

/**
 * Chains multiple callbacks into a single function
 *
 * @param callbacks - Array of callback functions that will be executed in order
 * @returns A single function that executes all callbacks
 */
function chain<T extends unknown[]>(...callbacks: ((...args: T) => void)[]): (...args: T) => void {
  return (...args: T) => {
    for (const callback of callbacks) {
      callback(...args);
    }
  };
}

/**
 * Interface for number formatting separators
 */
interface NumberFormatSeparators {
  /** The character used to separate decimal part (e.g., "." or ",") */
  decimalSeparator: string;
  /** The character used to separate thousands (e.g., "," or ".") */
  thousandSeparator: string;
}

/**
 * Extracts decimal and a thousand separators from a given locale's number format
 *
 * @param locale - The locale string to use for number formatting (e.g., 'en-US', 'de-DE')
 * @returns Object containing decimal and a thousand separators
 */
function getNumberFormatSeparators(locale?: string): NumberFormatSeparators {
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

/**
 * Normalizes an input value by removing formatting characters
 *
 * @param value - The input string to normalize
 * @param thousandSeparator - The thousand separator character to remove
 * @param decimalSeparator - The decimal separator to convert to standard dot notation
 * @returns Normalized string value ready for numeric conversion
 */
function normalizeInputValue(value: string, thousandSeparator: string, decimalSeparator: string): string {
  return value
    .replaceAll(new RegExp(`\\${thousandSeparator}`, 'g'), '')
    .replace(new RegExp(`\\${decimalSeparator}`), '.')
    .replaceAll(/[()]/g, '-');
}

/**
 * Checks if a keyboard event includes modifier keys (Ctrl, Alt, Meta, Shift)
 *
 * @param event - The keyboard event to check
 * @returns True if any modifier key is pressed
 */
function isModifierKey(event: KeyboardEvent<HTMLInputElement>): boolean {
  return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
}

/**
 * Determines if a key is a function key (F1-F12)
 *
 * @param key - The key name to check
 * @returns True if the key is a function key
 */
function isFunctionKey(key: string): boolean {
  return key.startsWith('F') && key.length > 1;
}

/**
 * Checks if a key represents a number (0-9)
 *
 * @param key - The key name to check
 * @returns True if the key represents a number
 */
function isNumberKey(key: string): boolean {
  return !Number.isNaN(Number(key));
}

/**
 * Clamps a numeric value between a minimum and maximum
 *
 * @param value - The value to clamp
 * @param min - The minimum allowed value (defaults to \-Infinity)
 * @param max - The maximum allowed value (defaults to Infinity)
 * @returns The clamped value
 */
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
