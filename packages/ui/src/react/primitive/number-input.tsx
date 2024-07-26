import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { Button, type ButtonProps } from '@/react/button';
import * as InputPrimitive from '@/react/primitive/input';
import { createInputScope } from '@/react/primitive/input';

/* -----------------------------------------------------------------------------
 * Context: NumberInput
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_NAME = 'NumberInput';

type ScopedProps<P> = P & { __scopeNumberInput?: Scope };
const [createNumberInputContext] = createContextScope(NUMBER_INPUT_NAME, [createInputScope]);
const useInputScope = createInputScope();

interface NumberInputRootContextValue {
  decrementAriaLabel: string;
  incrementAriaLabel: string;
  formatOptions?: Intl.NumberFormatOptions;
}

const [NumberInputRootProvider, useNumberInputRootContext] =
  createNumberInputContext<NumberInputRootContextValue>(NUMBER_INPUT_NAME);

/* -----------------------------------------------------------------------------
 * Component: NumberInputRoot
 * -------------------------------------------------------------------------- */

interface NumberInputRootProps extends InputPrimitive.InputProps {
  decrementAriaLabel?: string;
  formatOptions?: Intl.NumberFormatOptions;
  incrementAriaLabel?: string;
}

function NumberInputRoot(numberInputRootProps: NumberInputRootProps): React.JSX.Element {
  const { __scopeNumberInput, decrementAriaLabel, incrementAriaLabel, formatOptions, ...props } =
    numberInputRootProps as ScopedProps<NumberInputRootProps>;
  const inputRootScope = useInputScope(__scopeNumberInput);

  return (
    <NumberInputRootProvider
      decrementAriaLabel={decrementAriaLabel ?? 'Increase'}
      formatOptions={formatOptions}
      incrementAriaLabel={incrementAriaLabel ?? 'Decrease'}
      scope={__scopeNumberInput}
    >
      <InputPrimitive.Root {...inputRootScope} {...props} />
    </NumberInputRootProvider>
  );
}

NumberInputRoot.displayName = NUMBER_INPUT_NAME;

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
    const { incrementAriaLabel, decrementAriaLabel } = useNumberInputRootContext(
      NUMBER_INPUT_BUTTON_NAME,
      __scopeNumberInput,
    );

    return (
      <Button
        ref={forwardedRef}
        aria-label={slot === 'increment' ? incrementAriaLabel : decrementAriaLabel}
        size="icon"
        variant="ghost"
        {...props}
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
  NumberInputRoot,
  NumberInputRoot as Root,
  NumberInputButton,
  NumberInputButton as Button,
  NumberInputIcon,
  NumberInputIcon as Icon,
  type NumberInputRootProps,
  type NumberInputButtonProps,
  type NumberInputIconProps,
};
