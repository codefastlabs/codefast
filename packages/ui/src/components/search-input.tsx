'use client';

import type { ComponentProps, ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as InputPrimitive from '@codefast-ui/input';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { SearchIcon, XIcon } from 'lucide-react';
import { forwardRef } from 'react';

import type { InputVariantsProps } from '@/variants/input.variants';

import { Button } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { inputVariants } from '@/variants/input.variants';

/* -----------------------------------------------------------------------------
 * Component: SearchInput
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

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
      defaultValue,
      inputSize,
      loaderPosition,
      loading,
      onChange,
      prefix,
      spinner,
      suffix,
      value: valueProp,
      ...props
    },
    forwardedRef,
  ) => {
    const [value, setValue] = useControllableState({
      defaultProp: defaultValue,
      onChange,
      prop: valueProp,
    });

    return (
      <InputPrimitive.Root
        className={root({ className, inputSize })}
        loaderPosition={loaderPosition}
        loading={loading}
        prefix={prefix || <SearchIcon />}
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
            suffix={<XIcon />}
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

export type { SearchInputProps };
export { SearchInput };
