'use client';

import type { ComponentProps, JSX } from 'react';

import * as InputPrimitive from '@codefast-ui/input';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { SearchIcon, XIcon } from 'lucide-react';

import type { InputVariantsProps } from '@/variants/input.variants';

import { Button } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { inputVariants } from '@/variants/input.variants';

/* -----------------------------------------------------------------------------
 * Component: InputSearch
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

interface InputSearchProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentProps<typeof InputPrimitive.Item>, 'defaultValue' | 'onChange' | 'prefix' | 'type' | 'value'> {
  defaultValue?: string;
  onChange?: (value: string) => void;
  value?: string;
}

function InputSearch({
  className,
  defaultValue,
  disabled,
  inputSize,
  loaderPosition,
  loading,
  onChange,
  prefix,
  readOnly,
  spinner,
  suffix,
  value: valueProp,
  ...props
}: InputSearchProps): JSX.Element {
  const [value, setValue] = useControllableState({
    defaultProp: defaultValue,
    onChange,
    prop: valueProp,
  });

  return (
    <InputPrimitive.Root
      className={root({ className, inputSize })}
      data-slot="input-search"
      disabled={disabled}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix || <SearchIcon />}
      readOnly={readOnly}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item
        className={input({ inputSize })}
        data-slot="input-search-item"
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
          data-slot="input-search-clear"
          disabled={disabled}
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
}

/* -----------------------------------------------------------------------------
 * Deprecated
 * -------------------------------------------------------------------------- */

/**
 * @deprecated
 * This type is an alias of the InputSearchProps type.
 * Please use the InputSearchProps type instead to ensure consistency.
 */
type SearchInputProps = InputSearchProps;

/**
 * @deprecated
 * This component is an alias of the Input component.
 * Please use the Input component instead to ensure consistency.
 */
const SearchInput = InputSearch;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { InputSearchProps, SearchInputProps };
export { InputSearch, SearchInput };
