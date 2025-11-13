"use client";

import type { ComponentProps, JSX, MouseEventHandler } from "react";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/input-group";

/* -----------------------------------------------------------------------------
 * Component: InputPassword
 * -------------------------------------------------------------------------- */

type InputPasswordProps = Omit<ComponentProps<typeof InputGroupInput>, "type">;

function InputPassword({
  className,
  disabled,
  readOnly,
  ...props
}: InputPasswordProps): JSX.Element {
  const [type, setType] = useState<"password" | "text">("password");

  const togglePasswordVisibility = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    setType((previous) => (previous === "password" ? "text" : "password"));
  }, []);

  return (
    <InputGroup
      className={className}
      data-disabled={disabled ? "true" : undefined}
      data-slot="input-password"
    >
      <InputGroupInput
        autoCapitalize="none"
        data-slot="input-password-item"
        disabled={disabled}
        readOnly={readOnly}
        type={type}
        {...props}
      />
      <InputGroupButton
        aria-label={type === "password" ? "Show password" : "Hide password"}
        className="focus-visible:not-disabled:bg-input rounded-full focus-visible:ring-0"
        data-slot="input-password-toggle"
        disabled={disabled}
        size="icon-sm"
        type="button"
        variant="ghost"
        onClick={togglePasswordVisibility}
      >
        {type === "password" ? <EyeOffIcon /> : <EyeIcon />}
      </InputGroupButton>
    </InputGroup>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputPassword };
export type { InputPasswordProps };
