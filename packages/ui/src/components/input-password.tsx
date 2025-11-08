"use client";

import type { ComponentProps, JSX, MouseEventHandler } from "react";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useCallback, useState } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { Button } from "@/components/button";
import { inputVariants } from "@/components/input";
import { Spinner } from "@/components/spinner";
import * as InputPrimitive from "@/primitives/input";

/* -----------------------------------------------------------------------------
 * Variant: InputPassword
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: InputPassword
 * -------------------------------------------------------------------------- */

interface InputPasswordProps
  extends ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentProps<typeof InputPrimitive.Field>, "prefix" | "type">,
    VariantProps<typeof inputVariants> {}

function InputPassword({
  className,
  disabled,
  loaderPosition,
  loading,
  prefix,
  readOnly,
  spinner,
  suffix,
  ...props
}: InputPasswordProps): JSX.Element {
  const [type, setType] = useState<"password" | "text">("password");

  const togglePasswordVisibility = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    setType((previous) => (previous === "password" ? "text" : "password"));
  }, []);

  return (
    <InputPrimitive.Root
      className={root({ className: [!suffix && "pr-1.5", className] })}
      data-slot="input-password"
      disabled={disabled}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      readOnly={readOnly}
      spinner={spinner ?? <Spinner key="spinner" />}
      suffix={suffix}
    >
      <InputPrimitive.Field
        autoCapitalize="none"
        className={input()}
        data-slot="input-password-item"
        type={type}
        {...props}
      />
      <Button
        aria-label={type === "password" ? "Show password" : "Hide password"}
        className="focus-visible:not-disabled:bg-input size-7 rounded-full focus-visible:ring-0"
        data-slot="input-password-toggle"
        disabled={disabled}
        prefix={type === "password" ? <EyeOffIcon /> : <EyeIcon />}
        size="icon"
        variant="ghost"
        onClick={togglePasswordVisibility}
      />
    </InputPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputPassword };
export type { InputPasswordProps };
