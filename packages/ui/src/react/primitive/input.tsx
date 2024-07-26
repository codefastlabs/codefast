'use client';

import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Spinner } from '@/react/spinner';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    root: 'border-input inline-flex w-full cursor-text items-center gap-3 rounded-md border bg-transparent px-3 shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-0 has-[[disabled]]:cursor-default has-[[type=file]]:cursor-pointer has-[[disabled]]:opacity-50 [&_svg]:size-4',
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
 * Context: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

type ScopedProps<P> = P & { __scopeInput?: Scope };
const [createInputContext, createInputScope] = createContextScope(INPUT_NAME);

interface InputContextValue {
  inputRef: React.RefObject<HTMLInputElement>;
  inputSize?: InputVariantsProps['inputSize'];
}

const [InputProvider, useInputContext] = createInputContext<InputContextValue>(INPUT_NAME);

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

interface InputProps extends React.PropsWithChildren, InputVariantsProps {
  className?: string | undefined;
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

function Input(inputProps: InputProps): React.JSX.Element {
  const { __scopeInput, className, prefix, suffix, loading, loaderPosition, inputSize, children, ...props } =
    inputProps as ScopedProps<InputProps>;
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
    <InputProvider inputRef={inputRef} inputSize={inputSize} scope={__scopeInput}>
      <div className={root({ inputSize, className })} role="presentation" onPointerDown={handlePointerDown} {...props}>
        {loading && loaderPosition === 'prefix' ? <Spinner /> : prefix}
        {children}
        {loading && loaderPosition === 'suffix' ? <Spinner /> : suffix}
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
  ({ __scopeInput, className, ...props }: ScopedProps<InputItemProps>, forwardedRef) => {
    const { inputSize, inputRef } = useInputContext(INPUT_ITEM_NAME, __scopeInput);
    const composedInputRef = useComposedRefs(forwardedRef, inputRef);

    return <input ref={composedInputRef} className={input({ inputSize, className })} type="text" {...props} />;
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
  inputVariants,
  type InputProps,
  type InputProps as RootProps,
  type InputItemProps,
  type InputItemProps as ItemProps,
  type InputVariantsProps,
};
