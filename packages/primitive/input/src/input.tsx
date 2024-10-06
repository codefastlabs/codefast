import * as React from 'react';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

type ScopedProps<P> = P & { __scopeInput?: Scope };
const [createInputContext, createInputScope] = createContextScope(INPUT_NAME);

interface InputContextValue {
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const [InputProvider, useInputContext] =
  createInputContext<InputContextValue>(INPUT_NAME);

type InputProps = React.PropsWithChildren<{
  className?: string;
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: React.ReactNode;
  spinner?: React.ReactNode;
  suffix?: React.ReactNode;
}>;

function Input(inputProps: InputProps): React.JSX.Element {
  const {
    __scopeInput,
    children,
    loaderPosition = 'prefix',
    loading,
    prefix,
    spinner,
    suffix,
    ...props
  } = inputProps as ScopedProps<InputProps>;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
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
    <InputProvider inputRef={inputRef} scope={__scopeInput}>
      <div role="presentation" onPointerDown={handlePointerDown} {...props}>
        {loading && loaderPosition === 'prefix' ? spinner : prefix}
        {children}
        {loading && loaderPosition === 'suffix' ? spinner : suffix}
      </div>
    </InputProvider>
  );
}

Input.displayName = INPUT_NAME;

/* -----------------------------------------------------------------------------
 * Component: InputItem
 * -------------------------------------------------------------------------- */

const INPUT_ITEM_NAME = 'InputItem';

type InputItemElement = HTMLInputElement;
type InputItemProps = React.InputHTMLAttributes<HTMLInputElement>;

const InputItem = React.forwardRef<InputItemElement, InputItemProps>(
  ({ __scopeInput, ...props }: ScopedProps<InputItemProps>, forwardedRef) => {
    const { inputRef } = useInputContext(INPUT_ITEM_NAME, __scopeInput);
    const composedInputRef = useComposedRefs(forwardedRef, inputRef);

    return <input ref={composedInputRef} type="text" {...props} />;
  },
);

InputItem.displayName = INPUT_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createInputScope,
  Input,
  Input as Root,
  InputItem,
  InputItem as Item,
  type InputProps,
  type InputItemProps,
};
