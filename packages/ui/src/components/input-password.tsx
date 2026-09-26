import { EyeIcon, EyeOffIcon } from "lucide-react";
import type { ComponentProps, JSX, MouseEventHandler } from "react";
import { useCallback, useState } from "react";

import { InputGroup, InputGroupButton, InputGroupInput } from "#components/input-group";

// ── Component: InputPassword ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
interface InputPasswordProps extends Omit<ComponentProps<typeof InputGroupInput>, "type"> {
  /**
   * The accessible name of the reveal toggle while the password is shown.
   *
   * @defaultValue `"Hide password"`
   */
  concealLabel?: string | undefined;
  /**
   * The accessible name of the reveal toggle while the password is hidden.
   *
   * @defaultValue `"Show password"`
   */
  revealLabel?: string | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
function InputPassword({
  className,
  concealLabel = "Hide password",
  disabled,
  readOnly,
  revealLabel = "Show password",
  ...props
}: InputPasswordProps): JSX.Element {
  const [type, setType] = useState<"password" | "text">("password");

  const togglePasswordVisibility = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    setType((previous) => (previous === "password" ? "text" : "password"));
  }, []);

  return (
    <InputGroup className={className} data-disabled={disabled ? "true" : undefined} data-slot="input-password">
      <InputGroupInput autoCapitalize="none" disabled={disabled} readOnly={readOnly} type={type} {...props} />
      <InputGroupButton
        aria-label={type === "password" ? revealLabel : concealLabel}
        className="rounded-full"
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

// ── Exports ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export { InputPassword };
export type { InputPasswordProps };
