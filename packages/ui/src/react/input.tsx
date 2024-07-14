'use client';

import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Spinner } from './spinner';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    root: 'border-input inline-flex w-full cursor-text items-center gap-3 rounded-md border bg-transparent px-3 shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 has-[input[disabled]]:cursor-default has-[input[disabled]]:opacity-50 [&_svg]:size-4',
    slot: 'placeholder:text-muted-foreground size-full flex-1 bg-transparent text-sm outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-default',
  },
  variants: {
    inputSize: {
      default: {
        root: 'h-10',
      },
      xs: {
        root: 'h-8',
      },
      sm: {
        root: 'h-9',
      },
      lg: {
        root: 'h-11',
      },
    },
  },
  defaultVariants: {
    inputSize: 'default',
  },
});

type InputVariantsProps = VariantProps<typeof inputVariants>;

const { root, slot } = inputVariants();

/* -----------------------------------------------------------------------------
 * Context: Input
 * -------------------------------------------------------------------------- */

const INPUT_NAME = 'Input';

type ScopedProps<P> = P & { __scopeInput?: Scope };
const [createInputContext, createInputScope] = createContextScope(INPUT_NAME);

interface InputContextValue {
  inputRef: React.RefObject<HTMLInputElement>;
  disabled?: boolean;
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

function Input({
  __scopeInput,
  className,
  prefix,
  suffix,
  loading,
  loaderPosition,
  inputSize,
  children,
  ...props
}: ScopedProps<InputProps>): React.JSX.Element {
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
      inputElement.focus();
    });
  };

  return (
    <InputProvider inputRef={inputRef} scope={__scopeInput}>
      <div className={root({ inputSize, className })} {...props} role="presentation" onPointerDown={handlePointerDown}>
        {loading && loaderPosition === 'prefix' ? <Spinner /> : prefix}
        {children}
        {loading && loaderPosition === 'suffix' ? <Spinner /> : suffix}
      </div>
    </InputProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputSlot
 * -------------------------------------------------------------------------- */

const INPUT_SLOT_NAME = 'InputSlot';

type InputSlotElement = HTMLInputElement;
type InputSlotProps = React.InputHTMLAttributes<HTMLInputElement>;

const InputSlot = React.forwardRef<InputSlotElement, InputSlotProps>(
  ({ __scopeInput, className, ...props }: ScopedProps<InputSlotProps>, forwardedRef) => {
    const context = useInputContext(INPUT_SLOT_NAME, __scopeInput);
    const composedInputRef = useComposedRefs(forwardedRef, context.inputRef);

    return <input ref={composedInputRef} className={slot({ className })} type="text" {...props} />;
  },
);

InputSlot.displayName = 'Input';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createInputScope,
  Input,
  InputSlot,
  inputVariants,
  type InputProps,
  type InputSlotProps,
  type InputVariantsProps,
};
