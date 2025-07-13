"use client";

import { SearchIcon, XIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@/lib/utils";

import { Button } from "@/components/button";
import { inputVariants } from "@/components/input";
import { Spinner } from "@/components/spinner";
import * as InputPrimitive from "@codefast-ui/input";
import { useControllableState } from "@radix-ui/react-use-controllable-state";

/* -----------------------------------------------------------------------------
 * Component: InputSearch
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

interface InputSearchProps
  extends ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentProps<typeof InputPrimitive.Field>, "defaultValue" | "onChange" | "prefix" | "type" | "value">,
    VariantProps<typeof inputVariants> {
  defaultValue?: string;
  onChange?: (value?: string) => void;
  value?: string;
}

function InputSearch({
  className,
  defaultValue,
  disabled,
  loaderPosition,
  loading,
  onChange,
  prefix,
  readOnly,
  spinner,
  suffix,
  value: valueProperty,
  ...props
}: InputSearchProps): JSX.Element {
  const [value, setValue] = useControllableState<string | undefined>({
    defaultProp: defaultValue,
    onChange,
    prop: valueProperty,
  });

  return (
    <InputPrimitive.Root
      className={root({ className: [!suffix && "pr-1.5", className] })}
      data-slot="input-search"
      disabled={disabled}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix ?? <SearchIcon />}
      readOnly={readOnly}
      spinner={spinner ?? <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Field
        className={input()}
        data-slot="input-search-item"
        type="search"
        value={value ?? ""}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        {...props}
      />
      {value ? (
        <Button
          aria-label="Clear search"
          className="focus-visible:not-disabled:bg-input size-7 rounded-full focus-visible:ring-0"
          data-slot="input-search-clear"
          disabled={disabled ?? readOnly}
          size="icon"
          suffix={<XIcon />}
          variant="ghost"
          onClick={() => {
            setValue("");
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
 * This type is an alias of InputSearchProps.
 * Please use InputSearchProps instead to ensure consistency.
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

export { InputSearch, SearchInput };
export type { InputSearchProps, SearchInputProps };
