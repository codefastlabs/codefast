'use client';

import * as React from 'react';
import * as InputPrimitive from '@codefast-ui/input';
import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import {
  inputVariants,
  type InputVariantsProps,
} from '@/styles/input-variants';
import { Spinner } from '@/components/spinner';
import { Button } from '@/components/button';

/* -----------------------------------------------------------------------------
 * Component: SearchInput
 * -------------------------------------------------------------------------- */

const { root, input } = inputVariants();

type SearchInputElement = React.ComponentRef<typeof InputPrimitive.Item>;
interface SearchInputProps
  extends InputVariantsProps,
    React.ComponentProps<typeof InputPrimitive.Root>,
    Omit<
      React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>,
      'defaultValue' | 'onChange' | 'prefix' | 'type' | 'value'
    > {
  defaultValue?: string;
  onChange?: (value: string) => void;
  value?: string;
}

const SearchInput = React.forwardRef<SearchInputElement, SearchInputProps>(
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
          className={input({
            inputSize,
            className: [
              '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:after:hidden',
              '[&::-webkit-search-decoration]:appearance-none',
            ],
          })}
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
