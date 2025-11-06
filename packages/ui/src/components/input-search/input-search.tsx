"use client";

import type { ComponentProps, JSX } from "react";

import { SearchIcon, XIcon } from "lucide-react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { Button } from "@/components/button/button";
import { inputVariants } from "@/components/input/input.variants";
import { Spinner } from "@/components/spinner/spinner";
import * as InputPrimitive from "@/primitives/input";
import { useControllableState } from "@radix-ui/react-use-controllable-state";

/* -----------------------------------------------------------------------------
 * Component: InputSearch
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

interface InputSearchProps
  extends ComponentProps<typeof InputPrimitive.Root>,
    Omit<
      ComponentProps<typeof InputPrimitive.Field>,
      "defaultValue" | "onChange" | "prefix" | "type" | "value"
    >,
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
      prefix={prefix ?? <SearchIcon key="prefix" />}
      readOnly={readOnly}
      spinner={spinner ?? <Spinner key="spinner" />}
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
 * Exports
 * -------------------------------------------------------------------------- */

export { InputSearch };
export type { InputSearchProps };
