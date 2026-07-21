import { composeEventHandlers } from "radix-ui/internal";
import { Context } from "radix-ui/internal";
import { useControllableState } from "radix-ui/internal";
import type {
  ComponentProps,
  FocusEventHandler,
  JSX,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  RefObject,
} from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import * as InputPrimitive from "#/primitives/input";
import { createInputScope } from "#/primitives/input";

/* -----------------------------------------------------------------------------
 * Context: InputNumber
 * -------------------------------------------------------------------------- */

/**
 * The name of the InputNumber component constant.
 */
const NUMBER_INPUT_NAME = "InputNumber";

/**
 * Props that include an optional scope for the InputNumber component.
 */
type ScopedProps<P> = P & {
  /**
   * Optional scope for the InputNumber component context
   */
  __scopeInputNumber?: Context.Scope;
};

const [createInputNumberContext, createInputNumberScope] = Context.createContextScope(NUMBER_INPUT_NAME, [
  createInputScope,
]);
const useInputScope = createInputScope();

/**
 * Context value for the InputNumber component.
 */
interface InputNumberContextValue {
  /**
   * Formatting options for displaying the number value
   */
  formatOptions: Intl.NumberFormatOptions;

  /**
   * Function to format a number value as a string
   */
  formatValue: (value?: number) => string;

  /**
   * Reference to the input element
   */
  inputRef: RefObject<HTMLInputElement | null>;

  /**
   * Handler for when the value changes
   */
  onChange: (value?: number) => void;

  /**
   * Handler to decrement the value
   */
  onDecrement: () => void;

  /**
   * Handler to decrement the value to the minimum allowed
   */
  onDecrementToMin: () => void;

  /**
   * Handler to increment the value
   */
  onIncrement: () => void;

  /**
   * Handler to increment the value to the maximum allowed
   */
  onIncrementToMax: () => void;

  /**
   * Function to parse a value into a number
   */
  parseValue: (value: number | ReadonlyArray<string> | string | undefined) => number;

  /**
   * Accessible label for the decrement button
   */
  ariaDecrementLabel?: string;

  /**
   * Accessible label for the increment button
   */
  ariaIncrementLabel?: string;

  /**
   * Initial value used when the input is uncontrolled
   */
  defaultValue?: number;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Unique identifier for the input
   */
  id?: string;

  /**
   * Maximum allowed value
   */
  max?: number;

  /**
   * Minimum allowed value
   */
  min?: number;

  /**
   * Whether the input is read-only
   */
  readOnly?: boolean;

  /**
   * Step value for increments/decrements
   */
  step?: number;

  /**
   * Current value of the input
   */
  value?: number;
}

const [InputNumberContextProvider, useInputNumberContext] =
  createInputNumberContext<InputNumberContextValue>(NUMBER_INPUT_NAME);

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

/**
 * Props for the main InputNumber component.
 *
 * @since 0.3.16-canary.0
 */
interface InputNumberProps extends ComponentProps<typeof InputPrimitive.Root> {
  /**
   * Accessible label for the decrement button
   */
  ariaDecrementLabel?: string;

  /**
   * Accessible label for the increment button
   */
  ariaIncrementLabel?: string;

  /**
   * Initial value when uncontrolled
   */
  defaultValue?: number;

  /**
   * Options for number formatting
   */
  formatOptions?: Intl.NumberFormatOptions;

  /**
   * Unique identifier for the input
   */
  id?: string;

  /**
   * Locale used for number formatting
   */
  locale?: string;

  /**
   * Maximum allowed value
   */
  max?: number;

  /**
   * Minimum allowed value
   */
  min?: number;

  /**
   * Handler called when the value changes
   */
  onChange?: (value?: number) => void;

  /**
   * Step value for increments/decrements
   */
  step?: number;

  /**
   * Current value when controlled
   */
  value?: number;
}

/**
 * @since 0.3.16-canary.0
 */
function InputNumber(numberInputProps: ScopedProps<InputNumberProps>): JSX.Element {
  const {
    __scopeInputNumber,
    ariaDecrementLabel,
    ariaIncrementLabel,
    defaultValue,
    formatOptions = { minimumFractionDigits: 0, style: "decimal" },
    id,
    locale,
    max,
    min,
    onChange,
    step = 1,
    value: valueProperty,
    ...props
  } = numberInputProps;

  /**
   * Context.Scope for the input component
   */
  const inputScope = useInputScope(__scopeInputNumber);

  /**
   * Reference to the input element
   */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Controlled or uncontrolled value state
   */
  const [value, setValue] = useControllableState<number | undefined>({
    defaultProp: defaultValue,
    onChange,
    prop: valueProperty,
  });

  /**
   * Separators used for number formatting based on locale
   */
  const { decimalSeparator, thousandSeparator } = useMemo(() => getNumberFormatSeparators(locale), [locale]);

  // Stable reference so an inline `formatOptions` literal doesn't churn the format callbacks every render.
  const formatOptionsKey = JSON.stringify(formatOptions);
  const stableFormatOptions = useMemo<Intl.NumberFormatOptions>(
    () => JSON.parse(formatOptionsKey) as Intl.NumberFormatOptions,
    [formatOptionsKey],
  );

  /**
   * Formats a number value into a string representation
   * @param inputValue - The number to format
   * @returns A formatted string representation of the number
   */
  const formatValue = useCallback(
    (inputValue?: number): string => {
      if (inputValue === undefined || Number.isNaN(inputValue)) {
        return "";
      }

      return new Intl.NumberFormat(locale, stableFormatOptions).format(inputValue);
    },
    [stableFormatOptions, locale],
  );

  /**
   * Parses a string or number input into a normalized number value
   * @param inputValue - The value to parse
   * @returns The parsed number value, clamped between min and max
   */
  const parseValue = useCallback(
    (inputValue: number | ReadonlyArray<string> | string | undefined): number => {
      if (typeof inputValue === "number") {
        return clamp(inputValue, min, max);
      }

      if (typeof inputValue !== "string") {
        return Number.NaN;
      }

      const cleanedValue = inputValue.trim().replaceAll(/[^\d.,\-()]/g, "");

      if (cleanedValue === "") {
        return Number.NaN;
      }

      const normalizedValue = normalizeInputValue(cleanedValue, thousandSeparator, decimalSeparator);
      let parsedValue = Number.parseFloat(normalizedValue);

      if (stableFormatOptions.style === "percent") {
        parsedValue /= 100;
      }

      return Number.isNaN(parsedValue) ? 0 : clamp(parsedValue, min, max);
    },
    [decimalSeparator, stableFormatOptions.style, max, min, thousandSeparator],
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

      const parsedValue = parseValue(inputElement.value);
      const currentValue = Number.isNaN(parsedValue) ? 0 : parsedValue;
      const newValue = clamp(roundToStep(operation(currentValue), step), min, max);

      inputElement.value = formatValue(newValue);
      setValue(newValue);
    },
    [props.disabled, formatValue, max, min, parseValue, props.readOnly, setValue, step],
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
    <InputNumberContextProvider
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      defaultValue={defaultValue}
      disabled={props.disabled}
      formatOptions={stableFormatOptions}
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
    </InputNumberContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberField
 * -------------------------------------------------------------------------- */

/**
 * The name of the InputNumberField component constant.
 */
const NUMBER_INPUT_FIELD_NAME = "InputNumberField";

/**
 * Defines the props for the `InputNumberField` component.
 *
 * @since 0.3.16-canary.0
 */
type InputNumberFieldProps = Omit<
  ComponentProps<typeof InputPrimitive.Field>,
  "defaultValue" | "disabled" | "id" | "max" | "min" | "onChange" | "prefix" | "readOnly" | "step" | "value"
>;

/**
 * @since 0.3.16-canary.0
 */
function InputNumberField({
  __scopeInputNumber,
  onBlur,
  onKeyDown,
  ...props
}: ScopedProps<InputNumberFieldProps>): JSX.Element {
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
  } = useInputNumberContext(NUMBER_INPUT_FIELD_NAME, __scopeInputNumber);

  /**
   * Handles the blur event to format the value of the input.
   *
   * @param event - The blur event triggered when the input loses focus.
   */
  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    (event) => {
      const parsedValue = parseValue(event.target.value);
      const numericValue = Number.isNaN(parsedValue) ? undefined : parsedValue;
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
        case "ArrowUp": {
          onIncrement();
          event.preventDefault();
          break;
        }

        case "PageUp": {
          onIncrementToMax();
          event.preventDefault();
          break;
        }

        case "ArrowDown": {
          onDecrement();
          event.preventDefault();
          break;
        }

        case "PageDown": {
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
  const handleKeyDownPrevent = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      switch (event.key) {
        case "ArrowUp":

        case "ArrowDown":

        case "ArrowLeft":

        case "ArrowRight":

        case "PageUp":

        case "PageDown":

        case "Tab":

        case "Escape":

        case "Enter":

        case "Backspace":

        case "Delete":

        case "Home":

        case "End":

        case "%": {
          return;
        }

        case ".":

        case ",": {
          // Allow at most one decimal separator unless the current one is inside the selection being replaced.
          const inputElement = inputRef.current;

          if (
            inputElement &&
            inputElement.selectionStart === inputElement.selectionEnd &&
            /[.,]/.test(inputElement.value)
          ) {
            event.preventDefault();
          }

          return;
        }

        case "-": {
          // Allow a single leading sign only.
          const inputElement = inputRef.current;

          if (
            inputElement &&
            (inputElement.selectionStart !== 0 ||
              (inputElement.value.includes("-") && inputElement.selectionStart === inputElement.selectionEnd))
          ) {
            event.preventDefault();
          }

          return;
        }

        default: {
          if (isNumberKey(event.key) || isModifierKey(event) || isFunctionKey(event.key)) {
            return;
          }

          event.preventDefault();
        }
      }
    },
    [inputRef],
  );

  /**
   * Handles the Enter key to format the value of the input.
   *
   * @param event - The keyboard event triggered by pressing Enter.
   */
  const handleKeyDownEnter = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      const inputElement = inputRef.current;

      if (event.key !== "Enter" || !inputElement) {
        return;
      }

      const parsedValue = parseValue(inputElement.value);
      const numericValue = Number.isNaN(parsedValue) ? undefined : parsedValue;
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
  const combinedKeyDownHandler = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      composeEventHandlers(onKeyDown, chain(handleKeyDownPrevent, handleKeyDown, handleKeyDownEnter))(event);
    },
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

      // Match native number inputs: scroll up increases, scroll down decreases.
      if (event.deltaY < 0) {
        onIncrement();
      } else {
        onDecrement();
      }
    };

    const inputElement = inputRef.current;

    inputElement?.addEventListener("wheel", handleWheel);

    return (): void => {
      inputElement?.removeEventListener("wheel", handleWheel);
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
      onChange(defaultValue === undefined ? undefined : parseValue(defaultValue));
    };

    const form = inputElement.form;

    form?.addEventListener("reset", handleReset);

    return (): void => {
      form?.removeEventListener("reset", handleReset);
    };
  }, [defaultValue, inputRef, onChange, parseValue]);

  const hasValue = value !== undefined && !Number.isNaN(value);

  return (
    <InputPrimitive.Field
      ref={inputRef}
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={hasValue ? value : undefined}
      aria-valuetext={hasValue ? formatValue(value) : undefined}
      defaultValue={formatValue(value)}
      disabled={disabled}
      id={id}
      inputMode="decimal"
      max={max}
      min={min}
      readOnly={readOnly}
      role="spinbutton"
      step={step}
      onBlur={composeEventHandlers(onBlur, handleBlur)}
      onKeyDown={combinedKeyDownHandler}
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
const NUMBER_STEPPER_BUTTON_NAME = "NumberStepperButton";

/**
 * Props for the NumberStepperButton component.
 */
interface NumberStepperButtonProps extends ComponentProps<"button"> {
  /**
   * The operation to perform when the button is pressed.
   * - `'increment'`: Increases the value.
   * - `'decrement'`: Decreases the value.
   */
  operation: "decrement" | "increment";
}

function NumberStepperButton({
  __scopeInputNumber,
  operation,
  ...props
}: ScopedProps<NumberStepperButtonProps>): JSX.Element {
  // Destructures relevant context values for the button functionality.
  const { ariaDecrementLabel, ariaIncrementLabel, disabled, id, max, min, onDecrement, onIncrement, value } =
    useInputNumberContext(NUMBER_STEPPER_BUTTON_NAME, __scopeInputNumber);

  const isDisabled = useMemo(() => {
    if (disabled) {
      return true;
    }

    // Only the button that would push past a bound is disabled — the opposite one must stay usable.
    if (operation === "increment") {
      return max !== undefined && value !== undefined && value >= max;
    }

    return min !== undefined && value !== undefined && value <= min;
  }, [operation, min, max, value, disabled]);

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

  // Stop repeating once the button hits its bound mid-hold (a disabled button never receives pointerup) and on unmount.
  useEffect(() => {
    if (isDisabled) {
      clearActionInterval();
    }

    return clearActionInterval;
  }, [isDisabled, clearActionInterval]);

  /**
   * Handles pointer down events and triggers the appropriate action
   * (`increment` or `decrement`).
   */
  const handlePointerDown = useCallback<PointerEventHandler<HTMLButtonElement>>(() => {
    const action = operation === "increment" ? onIncrement : onDecrement;

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
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        const action = operation === "increment" ? onIncrement : onDecrement;

        action();
      }
    },
    [onDecrement, onIncrement, operation],
  );

  return (
    <button
      aria-controls={id}
      aria-label={operation === "increment" ? ariaIncrementLabel : ariaDecrementLabel}
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

/**
 * @since 0.3.16-canary.0
 */
type InputNumberIncrementButtonProps = Omit<ComponentProps<typeof NumberStepperButton>, "operation">;

/**
 * @since 0.3.16-canary.0
 */
function InputNumberIncrementButton(props: InputNumberIncrementButtonProps): JSX.Element {
  return <NumberStepperButton operation="increment" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberDecrementButton
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputNumberDecrementButtonProps = Omit<ComponentProps<typeof NumberStepperButton>, "operation">;

/**
 * @since 0.3.16-canary.0
 */
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
function chain<T extends Array<unknown>>(...callbacks: Array<(...args: T) => void>): (...args: T) => void {
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
  /**
   * The character used to separate decimal part (e.g., "." or ",")
   */
  decimalSeparator: string;
  /**
   * The character used to separate thousands (e.g., "," or ".")
   */
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
  let thousandSeparator = "";
  let decimalSeparator = "";

  for (const part of parts) {
    if (part.type === "group") {
      thousandSeparator = part.value;
    }

    if (part.type === "decimal") {
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
 * @param thousandSeparator - The thousand-separator character to remove
 * @param decimalSeparator - The decimal separator to convert to standard dot notation
 * @returns Normalized string value ready for numeric conversion
 */
function normalizeInputValue(value: string, thousandSeparator: string, decimalSeparator: string): string {
  return value
    .replaceAll(new RegExp(`\\${thousandSeparator}`, "g"), "")
    .replace(new RegExp(`\\${decimalSeparator}`), ".")
    .replaceAll(/[()]/g, "-");
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
  return key.startsWith("F") && key.length > 1;
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
function clamp(value: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a value to the decimal precision implied by the step, avoiding floating-point drift
 * (e.g. `0.1 + 0.2`) when stepping with fractional increments.
 *
 * @param value - The value to round
 * @param step - The step whose fractional digit count sets the precision
 * @returns The value rounded to the step's precision
 */
function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) {
    return value;
  }

  const fractionDigits = String(step).split(".")[1]?.length ?? 0;

  return Number(value.toFixed(fractionDigits));
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createInputNumberScope,
  InputNumberDecrementButton as DecrementButton,
  InputNumberField as Field,
  InputNumberIncrementButton as IncrementButton,
  InputNumber,
  InputNumberDecrementButton,
  InputNumberField,
  InputNumberIncrementButton,
  InputNumber as Root,
};

export type {
  InputNumberDecrementButtonProps,
  InputNumberFieldProps,
  InputNumberIncrementButtonProps,
  InputNumberProps,
};
