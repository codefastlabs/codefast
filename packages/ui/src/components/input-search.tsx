"use client";

import type { ComponentProps, JSX } from "react";

import { SearchIcon, XIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/input-group";
import { useControllableState } from "@radix-ui/react-use-controllable-state";

/* -----------------------------------------------------------------------------
 * Component: InputSearch
 * -------------------------------------------------------------------------- */

interface InputSearchProps
  extends Omit<
    ComponentProps<typeof InputGroupInput>,
    "defaultValue" | "onChange" | "type" | "value"
  > {
  defaultValue?: string;
  onChange?: (value?: string) => void;
  value?: string;
}

function InputSearch({
  className,
  defaultValue,
  disabled,
  onChange,
  readOnly,
  value: valueProperty,
  ...props
}: InputSearchProps): JSX.Element {
  const [value, setValue] = useControllableState<string | undefined>({
    defaultProp: defaultValue,
    onChange,
    prop: valueProperty,
  });

  return (
    <InputGroup
      className={className}
      data-disabled={disabled ? "true" : undefined}
      data-slot="input-search"
    >
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        data-slot="input-search-item"
        disabled={disabled}
        readOnly={readOnly}
        type="search"
        value={value ?? ""}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        {...props}
      />
      {value ? (
        <InputGroupButton
          aria-label="Clear search"
          className="focus-visible:not-disabled:bg-input rounded-full focus-visible:ring-0"
          data-slot="input-search-clear"
          disabled={disabled ?? readOnly}
          size="icon-sm"
          variant="ghost"
          onClick={() => {
            setValue("");
          }}
        >
          <XIcon />
        </InputGroupButton>
      ) : null}
    </InputGroup>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputSearch };
export type { InputSearchProps };
