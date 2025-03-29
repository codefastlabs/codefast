import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, JSX, PointerEventHandler, PropsWithChildren, ReactNode, RefObject } from 'react';

import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { createContextScope } from '@radix-ui/react-context';
import { useRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

/**
 * Type for adding scope to component props
 */
type ScopedProps<P> = P & {
  /**
   * Scope for the Input component context
   */
  __scopeInput?: Scope;
};

const [createInputContext, createInputScope] = createContextScope(INPUT_NAME);

/**
 * Context value for the Input component
 */
interface InputContextValue {
  /**
   * Reference to the input element
   */
  inputRef: RefObject<HTMLInputElement | null>;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Whether the input is in read-only mode
   */
  readOnly?: boolean;
}

const [InputProvider, useInputContext] = createInputContext<InputContextValue>(INPUT_NAME);

/**
 * Props for styling and appearance of the Input component
 */
interface InputVisualProps {
  /**
   * CSS class name for the input container
   */
  className?: string;

  /**
   * Element to display before the input
   */
  prefix?: ReactNode;

  /**
   * Custom spinner element for loading state
   */
  spinner?: ReactNode;

  /**
   * Element to display after the input
   */
  suffix?: ReactNode;
}

/**
 * Props for behavior and state of the Input component
 */
interface InputBehaviorProps {
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Position of the loading spinner - either before or after the input
   */
  loaderPosition?: 'prefix' | 'suffix';

  /**
   * Whether the input is in loading state
   */
  loading?: boolean;

  /**
   * Whether the input is in read-only mode
   */
  readOnly?: boolean;
}

/**
 * Combined props for the Input component
 */
type InputProps = PropsWithChildren<InputBehaviorProps & InputVisualProps>;

function Input(inputProps: ScopedProps<InputProps>): JSX.Element {
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

  /**
   * Reference to the input element
   */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles pointer down events on the input container
   * Focuses the input element when clicking on the container
   *
   * @param event - The pointer event object
   */
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

/**
 * Props for the InputItem component
 */
type InputItemProps = ComponentProps<'input'>;

function InputItem({ __scopeInput, ...props }: ScopedProps<InputItemProps>): JSX.Element {
  /**
   * Context values from parent Input component
   */
  const { disabled, inputRef, readOnly } = useInputContext(INPUT_ITEM_NAME, __scopeInput);

  /**
   * Combined ref that syncs with the parent's inputRef
   */
  const composedInputRef = useComposedRefs(inputRef);

  return <input ref={composedInputRef} disabled={disabled} readOnly={readOnly} type="text" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { createInputScope, Input, InputItem, InputItem as Item, Input as Root };
