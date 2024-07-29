'use client';

import * as React from 'react';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { composeEventHandlers } from '@radix-ui/primitive';
import { Primitive } from '@radix-ui/react-primitive';
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
  formatValue: (value: number) => string;
  ghost: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onDecrement: () => void;
  onIncrement: () => void;
  parseValue: (value: string | number | readonly string[] | undefined) => number;
  setGhost: React.Dispatch<React.SetStateAction<boolean>>;
  decrementAriaLabel?: string;
  incrementAriaLabel?: string;
}

const [NumberInputProvider, useNumberInputContext] =
  createNumberInputContext<NumberInputContextValue>(NUMBER_INPUT_NAME);

interface NumberInputProps extends InputPrimitive.InputProps {
  decrementAriaLabel?: string;
  formatOptions?: Intl.NumberFormatOptions;
  incrementAriaLabel?: string;
  locale?: string;
}

function NumberInput(numberInputProps: NumberInputProps): React.JSX.Element {
  const {
    __scopeNumberInput,
    decrementAriaLabel,
    incrementAriaLabel,
    formatOptions = {
      style: 'decimal',
      minimumFractionDigits: 0,
    },
    locale = navigator.language,
    ...props
  } = numberInputProps as ScopedProps<NumberInputProps>;
  const inputScope = useInputScope(__scopeNumberInput);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [ghost, setGhost] = React.useState(false);

  const { thousandSeparator, decimalSeparator } = React.useMemo(() => getNumberFormatSeparators(locale), [locale]);

  const formatValue = React.useCallback(
    (value: number): string => {
      if (isNaN(value)) {
        return '';
      }

      return new Intl.NumberFormat(locale, formatOptions).format(value);
    },
    [formatOptions, locale],
  );

  const parseValue = React.useCallback(
    (value: string | number | readonly string[] | undefined): number => {
      if (typeof value === 'number') {
        return value;
      }

      if (typeof value !== 'string') {
        return NaN;
      }

      const cleanedValue = value.trim().replace(/[^\d.,\-()]/g, '');

      if (cleanedValue === '') {
        return NaN;
      }

      const normalizedValue = normalizeInputValue(cleanedValue, thousandSeparator, decimalSeparator);

      if (formatOptions.style === 'percent') {
        return parseFloat(normalizedValue) / 100;
      }

      const parsedValue = parseFloat(normalizedValue);

      return isNaN(parsedValue) ? 0 : parsedValue;
    },
    [decimalSeparator, formatOptions.style, thousandSeparator],
  );

  const handleIncrement = React.useCallback(() => {
    if (!inputRef.current || inputRef.current.disabled || inputRef.current.readOnly) {
      return;
    }

    const step = getStepValue(inputRef, formatOptions);

    const max = getMaxValue(inputRef);
    const currentValue = parseValue(inputRef.current.value) || 0;

    const newValue = Math.min(currentValue + step, max);

    inputRef.current.value = formatValue(newValue);
  }, [formatOptions, formatValue, parseValue]);

  const handleDecrement = React.useCallback(() => {
    if (!inputRef.current || inputRef.current.disabled || inputRef.current.readOnly) {
      return;
    }

    const step = getStepValue(inputRef, formatOptions);
    const min = getMinValue(inputRef);
    const currentValue = parseValue(inputRef.current.value) || 0;
    const newValue = Math.max(currentValue - step, min);

    inputRef.current.value = formatValue(newValue);
  }, [formatOptions, formatValue, parseValue]);

  return (
    <NumberInputProvider
      decrementAriaLabel={decrementAriaLabel}
      formatOptions={formatOptions}
      formatValue={formatValue}
      ghost={ghost}
      incrementAriaLabel={incrementAriaLabel}
      inputRef={inputRef}
      parseValue={parseValue}
      scope={__scopeNumberInput}
      setGhost={setGhost}
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
type NumberInputItemProps = React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>;

const NumberInputItem = React.forwardRef<NumberInputItemElement, NumberInputItemProps>(
  ({ __scopeNumberInput, ...props }: ScopedProps<NumberInputItemProps>, forwardedRef): React.JSX.Element => {
    const inputScope = useInputScope(__scopeNumberInput);
    const { inputRef, onIncrement, onDecrement, formatValue, parseValue, setGhost } = useNumberInputContext(
      NUMBER_INPUT_ITEM_NAME,
      __scopeNumberInput,
    );
    const composedNumberInputRef = useComposedRefs(forwardedRef, inputRef);

    const handleBlur = React.useCallback<React.FocusEventHandler<HTMLInputElement>>(
      (event) => {
        const numericValue = parseValue(event.target.value);
        const formattedValue = formatValue(numericValue);

        if (formattedValue !== event.target.value) {
          event.target.value = formattedValue;
        }
      },
      [formatValue, parseValue],
    );

    const handleKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
      (event) => {
        if (['ArrowUp', 'PageUp'].includes(event.key)) {
          onIncrement();
          event.preventDefault();
        } else if (['ArrowDown', 'PageDown'].includes(event.key)) {
          onDecrement();
          event.preventDefault();
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
        if (event.key !== 'Enter' || !inputRef.current) {
          return;
        }

        const numericValue = parseValue(inputRef.current.value);
        const formattedValue = formatValue(numericValue);

        if (formattedValue !== inputRef.current.value) {
          inputRef.current.value = formattedValue;
        }
      },
      [formatValue, inputRef, parseValue],
    );

    React.useEffect(() => {
      const handleWheel = (event: WheelEvent): void => {
        if (!isElementActiveInput(inputRef.current)) {
          return;
        }

        event.preventDefault();

        if (event.deltaY < 0) {
          onIncrement();
        } else {
          onDecrement();
        }
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
    }, [onIncrement, onDecrement, inputRef]);

    React.useEffect(() => {
      setGhost(Boolean(props.disabled) || Boolean(props.readOnly));
    }, [props.disabled, props.readOnly, setGhost]);

    return (
      <InputPrimitive.Item
        ref={composedNumberInputRef}
        {...inputScope}
        {...props}
        defaultValue={!props.onChange ? formatValue(parseValue(props.defaultValue)) : undefined}
        value={props.onChange ? formatValue(parseValue(props.value)) : undefined}
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
    const { incrementAriaLabel, decrementAriaLabel, onIncrement, onDecrement, ghost } = useNumberInputContext(
      NUMBER_INPUT_BUTTON_IMPL_NAME,
      __scopeNumberInput,
    );
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
        aria-label={operation === 'increment' ? incrementAriaLabel : decrementAriaLabel}
        aria-live="polite"
        disabled={ghost}
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

function parseStepValue(inputRef: React.RefObject<HTMLInputElement>): number {
  const stepValue = inputRef.current?.step;
  const parsedValue = stepValue !== undefined ? parseFloat(stepValue) : NaN;

  return isNaN(parsedValue) ? 1 : parsedValue;
}

function getStepValue(inputRef: React.RefObject<HTMLInputElement>, formatOptions: Intl.NumberFormatOptions): number {
  const step = parseStepValue(inputRef);

  return formatOptions.style === 'percent' ? step / 100 : step;
}

function getMinValue(inputRef: React.RefObject<HTMLInputElement>): number {
  return parseFloat(inputRef.current?.min || '-Infinity');
}

function getMaxValue(inputRef: React.RefObject<HTMLInputElement>): number {
  return parseFloat(inputRef.current?.max || 'Infinity');
}

function chain<T extends unknown[]>(...callbacks: ((...args: T) => void)[]): (...args: T) => void {
  return (...args: T) => {
    for (const callback of callbacks) {
      callback(...args);
    }
  };
}

function isElementActiveInput(inputElement: HTMLInputElement | null): boolean {
  return Boolean(
    inputElement && !inputElement.disabled && !inputElement.readOnly && document.activeElement === inputElement,
  );
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
