'use client';

import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Spinner } from '@/react/spinner';

/* -----------------------------------------------------------------------------
 * Variant: InputRoot
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    root: 'border-input inline-flex w-full cursor-text items-center gap-3 rounded-md border bg-transparent px-3 shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 has-[[disabled]]:cursor-default has-[[type=file]]:cursor-pointer has-[[disabled]]:opacity-50 [&_svg]:size-4',
    input:
      'placeholder:text-muted-foreground size-full flex-1 bg-transparent text-sm outline-none file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-default',
  },
  variants: {
    inputSize: {
      default: {
        root: 'h-10',
        input: 'file:py-2.25',
      },
      xs: {
        root: 'h-8',
        input: 'file:py-1.25',
      },
      sm: {
        root: 'h-9',
        input: 'file:py-1.75',
      },
      lg: {
        root: 'h-11',
        input: 'file:py-2.75',
      },
    },
  },
  defaultVariants: {
    inputSize: 'default',
  },
});

type InputVariantsProps = VariantProps<typeof inputVariants>;

const { root, input } = inputVariants();

/* -----------------------------------------------------------------------------
 * Context: InputRoot
 * -------------------------------------------------------------------------- */

const INPUT_ROOT_NAME = 'InputRoot';

type ScopedProps<P> = P & { __scopeInputRoot?: Scope };
const [createInputRootContext, createInputRootScope] = createContextScope(INPUT_ROOT_NAME);

interface InputRootContextValue {
  inputRef: React.RefObject<HTMLInputElement>;
  inputSize?: InputVariantsProps['inputSize'];
}

const [InputRootProvider, useInputRootContext] = createInputRootContext<InputRootContextValue>(INPUT_ROOT_NAME);

/* -----------------------------------------------------------------------------
 * Component: InputRoot
 * -------------------------------------------------------------------------- */

interface InputRootProps extends React.PropsWithChildren, InputVariantsProps {
  className?: string | undefined;
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

function InputRoot({
  __scopeInputRoot,
  className,
  prefix,
  suffix,
  loading,
  loaderPosition,
  inputSize,
  children,
  ...props
}: ScopedProps<InputRootProps>): React.JSX.Element {
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
    <InputRootProvider inputRef={inputRef} inputSize={inputSize} scope={__scopeInputRoot}>
      <div className={root({ inputSize, className })} {...props} role="presentation" onPointerDown={handlePointerDown}>
        {loading && loaderPosition === 'prefix' ? <Spinner /> : prefix}
        {children}
        {loading && loaderPosition === 'suffix' ? <Spinner /> : suffix}
      </div>
    </InputRootProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

type InputElement = HTMLInputElement;
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<InputElement, InputProps>(
  ({ __scopeInputRoot, className, ...props }: ScopedProps<InputProps>, forwardedRef) => {
    const { inputSize, inputRef } = useInputRootContext(INPUT_NAME, __scopeInputRoot);
    const composedInputRef = useComposedRefs(forwardedRef, inputRef);

    return <input ref={composedInputRef} className={input({ inputSize, className })} type="text" {...props} />;
  },
);

Input.displayName = 'Input';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createInputRootScope,
  InputRoot,
  Input,
  inputVariants,
  type InputRootProps,
  type InputProps,
  type InputVariantsProps,
};
