import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";
import { use } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: InputOtp
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputOTPProps = ComponentProps<typeof OTPInput>;

/**
 * @since 0.3.16-canary.0
 */
function InputOTP({ className, containerClassName, ...props }: InputOTPProps): JSX.Element {
  return (
    <OTPInput
      aria-label="One-time password"
      className={cn("disabled:cursor-not-allowed", className)}
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      data-slot="input-otp"
      spellCheck={false}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputOTPGroupProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function InputOTPGroup({ className, ...props }: InputOTPGroupProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center rounded-lg has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40",
        className,
      )}
      data-slot="input-otp-group"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPSlot
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface InputOTPSlotProps extends ComponentProps<"div"> {
  index: number;
}

/**
 * @since 0.3.16-canary.0
 */
function InputOTPSlot({ className, index, ...props }: InputOTPSlotProps): JSX.Element {
  const inputOTPContext = use(OTPInputContext);
  const slot = inputOTPContext.slots[index];
  if (slot === undefined) {
    throw new Error(`InputOTPSlot: no slot at index ${index}`);
  }
  const { char, hasFakeCaret, isActive } = slot;

  return (
    <div
      className={cn(
        "relative flex size-8 items-center justify-center border-y border-e border-input text-sm shadow-xs transition-all outline-none first:rounded-s-lg first:border-s last:rounded-e-lg aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        className,
      )}
      data-active={isActive}
      data-slot="input-otp-slot"
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground animation-duration-1000" />
        </div>
      ) : null}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputOTPSeparatorProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function InputOTPSeparator({ ...props }: InputOTPSeparatorProps): JSX.Element {
  return (
    <div
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      data-slot="input-otp-separator"
      role="separator"
      {...props}
    >
      <MinusIcon />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
export type { InputOTPGroupProps, InputOTPProps, InputOTPSeparatorProps, InputOTPSlotProps };
