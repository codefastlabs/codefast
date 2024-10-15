'use client';

import { Button } from '@/components/button';
import { Spinner } from '@/components/spinner';
import {
  inputVariants,
  type InputVariantsProps,
} from '@/styles/input-variants';
import * as InputPrimitive from '@codefast-ui/input';
import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

/* -----------------------------------------------------------------------------
 * Component: SearchInput
 * -------------------------------------------------------------------------- */

const { root, input } = inputVariants();

type SearchInputElement = ComponentRef<typeof InputPrimitive.Item>;
interface SearchInputProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<
      ComponentPropsWithoutRef<typeof InputPrimitive.Item>,
      'defaultValue' | 'onChange' | 'prefix' | 'type' | 'value'
    > {
  defaultValue?: string;
  onChange?: (value: string) => void;
  value?: string;
}

const SearchInput = forwardRef<SearchInputElement, SearchInputProps>(
  (
    {
      className,
      inputSize,
      loaderPosition,
      loading,
      prefix,
      spinner,
      suffix,
      value: valueProp,
      defaultValue,
      onChange,
      ...props
    },
    forwardedRef,
  ) => {
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue,
      onChange,
    });

    return (
      <InputPrimitive.Root
        className={root({ inputSize, className })}
        loaderPosition={loaderPosition}
        loading={loading}
        prefix={prefix || <MagnifyingGlassIcon />}
        spinner={spinner || <Spinner />}
        suffix={suffix}
      >
        <InputPrimitive.Item
          ref={forwardedRef}
          className={input({ inputSize })}
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          {...props}
        />
        {value ? (
          <Button
            icon
            inside
            aria-label="Clear search"
            className="rounded-full"
            disabled={props.disabled}
            size={inputSize}
            suffix={<Cross2Icon />}
            variant="ghost"
            onClick={() => {
              setValue('');
            }}
          />
        ) : null}
      </InputPrimitive.Root>
    );
  },
);

SearchInput.displayName = 'SearchInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { SearchInput, type SearchInputProps };
