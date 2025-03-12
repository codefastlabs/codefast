import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, JSX, PointerEventHandler, PropsWithChildren, ReactNode, RefObject } from 'react';

import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { createContextScope } from '@radix-ui/react-context';
import { useRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

type ScopedProps<P> = P & { __scopeInput?: Scope };
const [createInputContext, createInputScope] = createContextScope(INPUT_NAME);

interface InputContextValue {
  inputRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  readOnly?: boolean;
}

const [InputProvider, useInputContext] = createInputContext<InputContextValue>(INPUT_NAME);

function Input(
  inputProps: ScopedProps<
    PropsWithChildren<{
      className?: string;
      disabled?: boolean;
      loaderPosition?: 'prefix' | 'suffix';
      loading?: boolean;
      prefix?: ReactNode;
      readOnly?: boolean;
      spinner?: ReactNode;
      suffix?: ReactNode;
    }>
  >,
): JSX.Element {
  const {
    __scopeInput,
    children,
    disabled,
    loaderPosition = 'prefix',
    loading,
    prefix,
    readOnly,
    spinner,
    suffix,
    ...props
  } = inputProps;
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('input, a')) {
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
    <InputProvider disabled={disabled} inputRef={inputRef} readOnly={readOnly} scope={__scopeInput}>
      <div
        data-disabled={disabled}
        data-readonly={readOnly}
        role="presentation"
        onPointerDown={handlePointerDown}
        {...props}
      >
        {loading && loaderPosition === 'prefix' ? spinner : prefix}
        {children}
        {loading && loaderPosition === 'suffix' ? spinner : suffix}
      </div>
    </InputProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputItem
 * -------------------------------------------------------------------------- */

const INPUT_ITEM_NAME = 'InputItem';

function InputItem({ __scopeInput, ...props }: ScopedProps<ComponentProps<'input'>>): JSX.Element {
  const { disabled, inputRef, readOnly } = useInputContext(INPUT_ITEM_NAME, __scopeInput);
  const composedInputRef = useComposedRefs(inputRef);

  return <input ref={composedInputRef} disabled={disabled} readOnly={readOnly} type="text" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { createInputScope, Input, InputItem, InputItem as Item, Input as Root };
