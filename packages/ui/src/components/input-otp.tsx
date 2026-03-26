"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import { use } from "react";

/* -----------------------------------------------------------------------------
 * Component: InputOtp
 * -------------------------------------------------------------------------- */

type InputOTPProps = ComponentProps<typeof OTPInput>;

function InputOTP({ className, containerClassName, ...props }: InputOTPProps): JSX.Element {
  return (
    <OTPInput
      aria-label="One-time password"
      className={cn(className)}
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      data-slot="input-otp"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPGroup
 * -------------------------------------------------------------------------- */

type InputOTPGroupProps = ComponentProps<"div">;

function InputOTPGroup({ className, ...props }: InputOTPGroupProps): JSX.Element {
  return (
    <div
      className={cn("flex items-center -space-x-px", className)}
      data-slot="input-otp-group"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPSlot
 * -------------------------------------------------------------------------- */

interface InputOTPSlotProps extends ComponentProps<"div"> {
  index: number;
}

function InputOTPSlot({ className, index, ...props }: InputOTPSlotProps): JSX.Element {
  const inputOTPContext = use(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      className={cn(
        "relative flex size-9 items-center justify-center border border-input text-sm outline-hidden transition-all not-has-disabled:shadow-xs first:rounded-l-lg last:rounded-r-lg aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
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

type InputOTPSeparatorProps = ComponentProps<"div">;

function InputOTPSeparator({ ...props }: InputOTPSeparatorProps): JSX.Element {
  return (
    <div data-slot="input-otp-separator" {...props}>
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
