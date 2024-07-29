'use client';

import * as React from 'react';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

type ScopedProps<P> = P & { __scopeInput?: Scope };
const [createInputContext, createInputScope] = createContextScope(INPUT_NAME);

interface InputContextValue {
  inputRef: React.RefObject<HTMLInputElement>;
}

const [InputProvider, useInputContext] = createInputContext<InputContextValue>(INPUT_NAME);

type InputProps = React.PropsWithChildren<{
  className?: string;
}>;

function Input(inputProps: InputProps): React.JSX.Element {
  const { __scopeInput, ...props } = inputProps as ScopedProps<InputProps>;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('input, a, button')) {
      return;
    }

    const inputElement = inputRef.current;

    if (!inputElement) {
      return;
    }

    requestAnimationFrame(() => {
      // if the input is a file input, we need to trigger a click event
      if (inputElement.type === 'file') {
        inputElement.click();

        return;
      }

      inputElement.focus();
    });
  };

  return (
    <InputProvider inputRef={inputRef} scope={__scopeInput}>
      <Primitive.div role="presentation" onPointerDown={handlePointerDown} {...props} />
    </InputProvider>
  );
}

Input.displayName = INPUT_NAME;

/* -----------------------------------------------------------------------------
 * Component: InputItem
 * -------------------------------------------------------------------------- */

const INPUT_ITEM_NAME = 'InputItem';

type InputItemElement = React.ElementRef<typeof Primitive.input>;
type InputItemProps = React.ComponentPropsWithoutRef<typeof Primitive.input>;

const InputItem = React.forwardRef<InputItemElement, InputItemProps>(
  ({ __scopeInput, ...props }: ScopedProps<InputItemProps>, forwardedRef) => {
    const { inputRef } = useInputContext(INPUT_ITEM_NAME, __scopeInput);
    const composedInputRef = useComposedRefs(forwardedRef, inputRef);

    return <Primitive.input ref={composedInputRef} type="text" {...props} />;
  },
);

InputItem.displayName = INPUT_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { createInputScope, Input, Input as Root, InputItem, InputItem as Item, type InputProps, type InputItemProps };
