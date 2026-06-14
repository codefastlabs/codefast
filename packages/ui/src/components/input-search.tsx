import { SearchIcon, XIcon } from "lucide-react";
import { useControllableState } from "radix-ui/internal";
import type { ComponentProps, JSX } from "react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "#/components/input-group";

/* -----------------------------------------------------------------------------
 * Component: InputSearch
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface InputSearchProps extends Omit<
  ComponentProps<typeof InputGroupInput>,
  "defaultValue" | "onChange" | "type" | "value"
> {
  defaultValue?: string;
  onChange?: (value?: string) => void;
  value?: string;
}

/**
 * @since 0.3.16-canary.0
 */
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
    <InputGroup className={className} data-disabled={disabled ? "true" : undefined} data-slot="input-search">
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
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
          className="rounded-full"
          data-slot="input-search-clear"
          disabled={disabled ?? readOnly}
          size="icon-sm"
          type="button"
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
