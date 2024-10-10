import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import {
  forwardRef,
  type InputHTMLAttributes,
  type JSX,
  type PointerEventHandler,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
  useRef,
} from 'react';

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

type ScopedProps<P> = P & { __scopeInput?: Scope };
const [createInputContext, createInputScope] = createContextScope(INPUT_NAME);

interface InputContextValue {
  inputRef: RefObject<HTMLInputElement | null>;
}

const [InputProvider, useInputContext] =
  createInputContext<InputContextValue>(INPUT_NAME);

type InputProps = PropsWithChildren<{
  className?: string;
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: ReactNode;
  spinner?: ReactNode;
  suffix?: ReactNode;
}>;

function Input(inputProps: InputProps): JSX.Element {
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
type InputItemProps = InputHTMLAttributes<HTMLInputElement>;

const InputItem = forwardRef<InputItemElement, InputItemProps>(
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
  type InputItemProps,
  type InputProps,
};
