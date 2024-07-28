'use client';

import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { composeEventHandlers } from '@radix-ui/primitive';
import { Button, type ButtonProps } from '@/react/button';
import * as InputPrimitive from '@/react/primitive/input';
import { createInputScope } from '@/react/primitive/input';
import { chain } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_NAME = 'NumberInput';

type ScopedProps<P> = P & { __scopeNumberInput?: Scope };
const [createNumberInputContext, createNumberInputScope] = createContextScope(NUMBER_INPUT_NAME, [createInputScope]);
const useInputScope = createInputScope();

interface NumberInputContextValue {
  formatValue: (value: number) => string;
  inputRef: React.RefObject<HTMLInputElement>;
  onDecrement: () => void;
  onIncrement: () => void;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  value: number;
  decrementAriaLabel?: string;
  formatOptions?: Intl.NumberFormatOptions;
  incrementAriaLabel?: string;
}

const [NumberInputProvider, useNumberInputContext] =
  createNumberInputContext<NumberInputContextValue>(NUMBER_INPUT_NAME);

interface NumberInputProps extends InputPrimitive.InputProps {
  decrementAriaLabel?: string;
  formatOptions?: Intl.NumberFormatOptions;
  incrementAriaLabel?: string;
}

function NumberInput(numberInputProps: NumberInputProps): React.JSX.Element {
  const { __scopeNumberInput, decrementAriaLabel, incrementAriaLabel, formatOptions, ...props } =
    numberInputProps as ScopedProps<NumberInputProps>;
  const inputScope = useInputScope(__scopeNumberInput);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [number, setNumber] = React.useState<number>(0);

  const formatValue = React.useCallback(
    (value: number): string => {
      if (formatOptions) {
        return new Intl.NumberFormat(undefined, formatOptions).format(value);
      }

      return value.toString();
    },
    [formatOptions],
  );

  const handleIncrement = React.useCallback(() => {
    if (!inputRef.current) {
      return;
    }

    const step = parseFloat(inputRef.current.step) || (formatOptions?.style === 'percent' ? 0.01 : 1);
    const max = parseFloat(inputRef.current.max);

    setNumber((prev) => {
      const newValue = prev + step;

      return !isNaN(max) ? Math.min(newValue, max) : newValue;
    });
  }, [formatOptions?.style]);

  const handleDecrement = React.useCallback(() => {
    if (!inputRef.current) {
      return;
    }

    const step = parseFloat(inputRef.current.step) || (formatOptions?.style === 'percent' ? 0.01 : 1);
    const min = parseFloat(inputRef.current.min);

    setNumber((prev) => {
      const newValue = prev - step;

      return !isNaN(min) ? Math.max(newValue, min) : newValue;
    });
  }, [formatOptions?.style]);

  return (
    <NumberInputProvider
      decrementAriaLabel={decrementAriaLabel}
      formatOptions={formatOptions}
      formatValue={formatValue}
      incrementAriaLabel={incrementAriaLabel}
      inputRef={inputRef}
      scope={__scopeNumberInput}
      setValue={setNumber}
      value={number}
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
    const { inputRef, onIncrement, onDecrement, formatOptions, setValue, formatValue } = useNumberInputContext(
      NUMBER_INPUT_ITEM_NAME,
      __scopeNumberInput,
    );
    const composedNumberInputRef = useComposedRefs(forwardedRef, inputRef);

    const handleChange = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>(
      (event) => {
        const numericValue = parseFloat(event.target.value);

        if (!isNaN(numericValue)) {
          setValue(numericValue);
        }
      },
      [setValue],
    );

    const handleBlur = React.useCallback<React.FocusEventHandler<HTMLInputElement>>(
      (event) => {
        if (!formatOptions) {
          return;
        }

        const formattedValue = formatValue(parseFloat(event.target.value));

        if (formattedValue !== event.target.value) {
          event.target.value = formattedValue;
        }
      },
      [formatOptions, formatValue],
    );

    const handleKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
      (event) => {
        if (['ArrowUp', 'PageUp'].includes(event.key)) {
          onIncrement();
        } else if (['ArrowDown', 'PageDown'].includes(event.key)) {
          onDecrement();
        }
      },
      [onIncrement, onDecrement],
    );

    const handleKeyDownPrevent = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>((event) => {
      const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
      const isNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(
        event.key,
      );
      const isFunctionKey = event.key.startsWith('F') && event.key.length > 1;
      const isOthersKey = ['Tab', 'Escape', 'Enter', 'Backspace', 'Delete'].includes(event.key);
      const isAllowedKey = isNavigationKey || isFunctionKey || isModifierKey || isOthersKey;

      if (!isAllowedKey && isNaN(Number(event.key))) {
        event.preventDefault();
      }
    }, []);

    const handleKeyDownEnter = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
      (event) => {
        if (event.key === 'Enter') {
          if (!formatOptions) {
            return;
          }

          const numericValue = parseFloat(event.currentTarget.value);

          if (!isNaN(numericValue)) {
            event.currentTarget.value = formatValue(numericValue);
          }
        }
      },
      [formatOptions, formatValue],
    );

    React.useEffect(() => {
      const handleWheel = (event: WheelEvent): void => {
        if (document.activeElement === inputRef.current) {
          event.preventDefault();

          if (event.deltaY < 0) {
            onIncrement();
          } else {
            onDecrement();
          }
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

    return (
      <InputPrimitive.Item
        ref={composedNumberInputRef}
        {...inputScope}
        {...props}
        onBlur={composeEventHandlers(props.onBlur, handleBlur)}
        onChange={composeEventHandlers(props.onChange, handleChange)}
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
 * Component: NumberInputIcon
 * -------------------------------------------------------------------------- */

interface NumberInputIconProps extends ButtonProps {
  slot: 'decrement' | 'increment';
  iconType?: 'chevron' | 'default';
}

function NumberInputIcon({ slot, iconType }: NumberInputIconProps): React.JSX.Element {
  if (iconType === 'chevron') {
    return slot === 'increment' ? <ChevronUpIcon /> : <ChevronDownIcon />;
  }

  return slot === 'increment' ? <PlusIcon /> : <MinusIcon />;
}

/* -----------------------------------------------------------------------------
 * Component: NumberInputButton
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_BUTTON_NAME = 'NumberInputButton';

type NumberInputButtonElement = React.ElementRef<typeof Button>;
type NumberInputButtonProps = NumberInputIconProps;

const NumberInputButton = React.forwardRef<NumberInputButtonElement, NumberInputButtonProps>(
  (
    { __scopeNumberInput, slot, iconType, ...props }: ScopedProps<NumberInputButtonProps>,
    forwardedRef,
  ): React.JSX.Element => {
    const { incrementAriaLabel, decrementAriaLabel, onIncrement, onDecrement } = useNumberInputContext(
      NUMBER_INPUT_BUTTON_NAME,
      __scopeNumberInput,
    );

    const handleClick = (): void => {
      if (slot === 'increment') {
        onIncrement();
      } else {
        onDecrement();
      }
    };

    return (
      <Button
        ref={forwardedRef}
        aria-label={slot === 'increment' ? incrementAriaLabel : decrementAriaLabel}
        size="icon"
        variant="ghost"
        {...props}
        onClick={handleClick}
      >
        <NumberInputIcon iconType={iconType} slot={slot} />
      </Button>
    );
  },
);

NumberInputButton.displayName = NUMBER_INPUT_BUTTON_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createNumberInputScope,
  NumberInput,
  NumberInput as Root,
  NumberInputItem,
  NumberInputItem as Item,
  NumberInputButton,
  NumberInputButton as Button,
  NumberInputIcon,
  NumberInputIcon as Icon,
  type NumberInputProps,
  type NumberInputProps as RootProps,
  type NumberInputItemProps,
  type NumberInputItemProps as ItemProps,
  type NumberInputButtonProps,
  type NumberInputButtonProps as ButtonProps,
  type NumberInputIconProps,
  type NumberInputIconProps as IconProps,
};
