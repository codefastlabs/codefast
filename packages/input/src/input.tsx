import { useRef } from "react";
import type { ComponentProps, JSX, PointerEventHandler, PropsWithChildren, ReactNode, RefObject } from "react";

import type { Scope } from "@radix-ui/react-context";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { createContextScope } from "@radix-ui/react-context";

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = "Input";

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

const [InputContextProvider, useInputContext] = createInputContext<InputContextValue>(INPUT_NAME);

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
 * Props for the behavior and state of the Input component
 */
interface InputBehaviorProps {
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Position of the loading spinner - either before or after the input
   */
  loaderPosition?: "prefix" | "suffix";

  /**
   * Whether the input is in the loading state
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
    loaderPosition = "prefix",
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

    // Skip handling when clicking directly on input, links, buttons, or other interactive elements
    // This prevents interference with native input/link/button behavior
    if (target.tagName.toLowerCase() === "input" || target.closest("input, a, button")) {
      event.stopPropagation();

      return;
    }

    const inputElement = inputRef.current;

    if (!inputElement) {
      return;
    }

    // Key solution: If input already has focus, only prevent default behavior
    // This prevents the focus from being lost when clicking on the container padding
    // and eliminates the flickering effect
    if (document.activeElement === inputElement) {
      event.preventDefault();

      return;
    }

    // Only attempt to focus the input if it's not already focused
    requestAnimationFrame(() => {
      // Special handling for file inputs - trigger the file selection dialog
      if (inputElement.type === "file") {
        inputElement.click();

        return;
      }

      // Only focus the input if it doesn't already have focus
      // This avoids unnecessary re-focusing which can cause UI flickers
      if (document.activeElement !== inputElement) {
        inputElement.focus();
      }
    });
  };

  return (
    <InputContextProvider disabled={disabled} inputRef={inputRef} readOnly={readOnly} scope={__scopeInput}>
      <div
        data-disabled={disabled}
        data-readonly={readOnly}
        role="presentation"
        onPointerDown={handlePointerDown}
        {...props}
      >
        {loading && loaderPosition === "prefix" ? spinner : prefix}
        {children}
        {loading && loaderPosition === "suffix" ? spinner : suffix}
      </div>
    </InputContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputField
 * -------------------------------------------------------------------------- */

const INPUT_FIELD_NAME = "InputField";

/**
 * Props for the InputField component
 */
type InputFieldProps = ComponentProps<"input">;

function InputField({ __scopeInput, ...props }: ScopedProps<InputFieldProps>): JSX.Element {
  /**
   * Context values from parent Input component
   */
  const { disabled, inputRef, readOnly } = useInputContext(INPUT_FIELD_NAME, __scopeInput);

  /**
   * Combined ref that syncs with the parent's inputRef
   */
  const composedInputRef = useComposedRefs(inputRef);

  return <input ref={composedInputRef} disabled={disabled} readOnly={readOnly} type="text" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { createInputScope, InputField as Field, Input, InputField, Input as Root };

export type { InputFieldProps, InputProps };
