'use client';

import {
  OTPInput,
  OTPInputContext,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from 'input-otp';
import { DotIcon } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef, type HTMLAttributes, useContext } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: InputOtp
 * -------------------------------------------------------------------------- */

type InputOTPElement = ComponentRef<typeof OTPInput>;
type InputOTPProps = ComponentPropsWithoutRef<typeof OTPInput>;

const InputOTP = forwardRef<InputOTPElement, InputOTPProps>(
  ({ className, containerClassName, ...props }, forwardedRef) => (
    <OTPInput
      ref={forwardedRef}
      className={cn('disabled:cursor-default', className)}
      containerClassName={cn('flex items-center gap-2', 'has-[:disabled]:opacity-50', containerClassName)}
      {...props}
    />
  ),
);

InputOTP.displayName = 'InputOTP';

/* -----------------------------------------------------------------------------
 * Component: InputOTPGroup
 * -------------------------------------------------------------------------- */

type InputOTPGroupElement = HTMLDivElement;
type InputOTPGroupProps = HTMLAttributes<HTMLDivElement>;

const InputOTPGroup = forwardRef<InputOTPGroupElement, InputOTPGroupProps>(({ className, ...props }, forwardedRef) => (
  <div ref={forwardedRef} className={cn('flex items-center', className)} {...props} />
));

InputOTPGroup.displayName = 'InputOTPGroup';

/* -----------------------------------------------------------------------------
 * Component: InputOTPSlot
 * -------------------------------------------------------------------------- */

type InputOTPSlotElement = HTMLDivElement;

interface InputOTPSlotProps extends HTMLAttributes<HTMLDivElement> {
  index: number;
}

const InputOTPSlot = forwardRef<InputOTPSlotElement, InputOTPSlotProps>(
  ({ index, className, ...props }, forwardedRef) => {
    const inputOTPContext = useContext(OTPInputContext);
    const slot = inputOTPContext.slots[index];

    return (
      <div
        ref={forwardedRef}
        className={cn(
          'border-input relative flex size-10 items-center justify-center border-y border-r text-sm shadow-sm transition-all',
          'first:rounded-l-md first:border-l',
          'last:rounded-r-md',
          slot.isActive && 'z-10 outline outline-2',
          className,
        )}
        {...props}
      >
        {slot.char}
        {slot.hasFakeCaret ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="animate-caret-blink bg-foreground animate-duration-1000 h-4 w-px" />
          </div>
        ) : null}
      </div>
    );
  },
);

InputOTPSlot.displayName = 'InputOTPSlot';

/* -----------------------------------------------------------------------------
 * Component: InputOTPSeparator
 * -------------------------------------------------------------------------- */

type InputOTPSeparatorElement = HTMLDivElement;
type InputOTPSeparatorProps = HTMLAttributes<HTMLDivElement>;

const InputOTPSeparator = forwardRef<InputOTPSeparatorElement, InputOTPSeparatorProps>(({ ...props }, forwardedRef) => (
  <div ref={forwardedRef} role="separator" {...props}>
    <DotIcon />
  </div>
));

InputOTPSeparator.displayName = 'InputOTPSeparator';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
  type InputOTPGroupProps,
  type InputOTPProps,
  type InputOTPSeparatorProps,
  type InputOTPSlotProps,
};
