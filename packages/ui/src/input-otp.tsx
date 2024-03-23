"use client";

import * as React from "react";
import { DotFilledIcon } from "@radix-ui/react-icons";
import {
  OTPInput,
  OTPInputContext,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "input-otp";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: InputOtp
 * -------------------------------------------------------------------------- */

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

/* -----------------------------------------------------------------------------
 * Component: InputOTPGroup
 * -------------------------------------------------------------------------- */

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

/* -----------------------------------------------------------------------------
 * Component: InputOTPSlot
 * -------------------------------------------------------------------------- */

const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "border-input relative flex h-10 w-10 items-center justify-center border-y border-r text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        slot?.isActive && "ring-ring ring-offset-background z-10 ring-2",
        className,
      )}
      {...props}
    >
      {slot?.char}
      {slot?.hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      ) : null}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

/* -----------------------------------------------------------------------------
 * Component: InputOTPSeparator
 * -------------------------------------------------------------------------- */

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <DotFilledIcon />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  REGEXP_ONLY_DIGITS_AND_CHARS,
};
