'use client';

import * as React from 'react';
import { DotFilledIcon } from '@radix-ui/react-icons';
import {
  OTPInput,
  OTPInputContext,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from 'input-otp';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: InputOtp
 * -------------------------------------------------------------------------- */

type InputOTPElement = React.ElementRef<typeof OTPInput>;
type InputOTPProps = React.ComponentPropsWithoutRef<typeof OTPInput>;

const InputOTP = React.forwardRef<InputOTPElement, InputOTPProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      className={cn('disabled:cursor-not-allowed', className)}
      containerClassName={cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName)}
      {...props}
    />
  ),
);

InputOTP.displayName = 'InputOTP';

/* -----------------------------------------------------------------------------
 * Component: InputOTPGroup
 * -------------------------------------------------------------------------- */

type InputOTPGroupElement = HTMLDivElement;
type InputOTPGroupProps = React.HTMLAttributes<HTMLDivElement>;

const InputOTPGroup = React.forwardRef<InputOTPGroupElement, InputOTPGroupProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center', className)} {...props} />
));

InputOTPGroup.displayName = 'InputOTPGroup';

/* -----------------------------------------------------------------------------
 * Component: InputOTPSlot
 * -------------------------------------------------------------------------- */

type InputOTPSlotElement = HTMLDivElement;

interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
}

const InputOTPSlot = React.forwardRef<InputOTPSlotElement, InputOTPSlotProps>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        'border-input relative flex size-10 items-center justify-center border-y border-r text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        slot?.isActive && 'z-10 outline outline-2',
        className,
      )}
      {...props}
    >
      {slot?.char}
      {slot?.hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground animate-duration-1000 h-4 w-px" />
        </div>
      ) : null}
    </div>
  );
});

InputOTPSlot.displayName = 'InputOTPSlot';

/* -----------------------------------------------------------------------------
 * Component: InputOTPSeparator
 * -------------------------------------------------------------------------- */

type InputOTPSeparatorElement = HTMLDivElement;
type InputOTPSeparatorProps = React.HTMLAttributes<HTMLDivElement>;

const InputOTPSeparator = React.forwardRef<InputOTPSeparatorElement, InputOTPSeparatorProps>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <DotFilledIcon />
  </div>
));

InputOTPSeparator.displayName = 'InputOTPSeparator';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  type InputOTPProps,
  type InputOTPGroupProps,
  type InputOTPSlotProps,
  type InputOTPSeparatorProps,
  REGEXP_ONLY_DIGITS_AND_CHARS,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
};
