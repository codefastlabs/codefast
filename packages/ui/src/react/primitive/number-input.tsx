import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { Button, type ButtonProps } from '@/react/button';
import { createInputScope, InputRoot, type InputRootProps } from '@/react/primitive/input';

/* -----------------------------------------------------------------------------
 * Context: NumberInputRoot
 * -------------------------------------------------------------------------- */

const NUMBER_INPUT_NAME = 'NumberInput';

type ScopedProps<P> = P & { __scopeNumberInputRoot?: Scope };
const [createNumberInputContext] = createContextScope(NUMBER_INPUT_NAME, [createInputScope]);
const useInputRootScope = createInputScope();

interface NumberInputRootContextValue {
  decrementAriaLabel?: string;
  incrementAriaLabel?: string;
}

const [NumberInputRootProvider, useNumberInputRootContext] =
  createNumberInputContext<NumberInputRootContextValue>(NUMBER_INPUT_NAME);

/* -----------------------------------------------------------------------------
 * Component: NumberInputRoot
 * -------------------------------------------------------------------------- */

interface NumberInputRootProps extends NumberInputRootContextValue, InputRootProps {
  formatOptions?: Intl.NumberFormatOptions;
}

function NumberInputRoot({
  __scopeNumberInputRoot,
  incrementAriaLabel,
  decrementAriaLabel,
  ...props
}: ScopedProps<NumberInputRootProps>): React.JSX.Element {
  const inputRootScope = useInputRootScope(__scopeNumberInputRoot);

  return (
    <NumberInputRootProvider
      decrementAriaLabel={decrementAriaLabel}
      incrementAriaLabel={incrementAriaLabel}
      scope={__scopeNumberInputRoot}
    >
      <InputRoot {...inputRootScope} {...props} />
    </NumberInputRootProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NumberInputButtonIcon
 * -------------------------------------------------------------------------- */

interface NumberInputButtonIconProps extends ButtonProps {
  slot: 'decrement' | 'increment';
  iconType?: 'chevron' | 'default';
}

function NumberInputButtonIcon({ slot, iconType }: NumberInputButtonIconProps): React.JSX.Element {
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
type NumberInputButtonProps = NumberInputButtonIconProps;

const NumberInputButton = React.forwardRef<NumberInputButtonElement, NumberInputButtonProps>(
  (
    { __scopeNumberInputRoot, slot, iconType, ...props }: ScopedProps<NumberInputButtonProps>,
    forwardedRef,
  ): React.JSX.Element => {
    const { incrementAriaLabel, decrementAriaLabel } = useNumberInputRootContext(
      NUMBER_INPUT_BUTTON_NAME,
      __scopeNumberInputRoot,
    );

    return (
      <Button ref={forwardedRef} aria-label={slot === 'increment' ? incrementAriaLabel : decrementAriaLabel} {...props}>
        <NumberInputButtonIcon iconType={iconType} slot={slot} />
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
  NumberInputButtonIcon,
  NumberInputButtonIcon as ButtonIcon,
  type NumberInputRootProps,
  type NumberInputButtonProps,
  type NumberInputButtonIconProps,
};
