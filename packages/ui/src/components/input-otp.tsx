'use client';

import type { ComponentProps, JSX } from 'react';

import { OTPInput, OTPInputContext } from 'input-otp';
import { DotIcon } from 'lucide-react';
import { useContext } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: InputOtp
 * -------------------------------------------------------------------------- */

function InputOTP({ className, containerClassName, ...props }: ComponentProps<typeof OTPInput>): JSX.Element {
  return (
    <OTPInput
      aria-label="One-time password"
      className={cn(className)}
      containerClassName={cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
      data-slot="input-otp"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPGroup
 * -------------------------------------------------------------------------- */

function InputOTPGroup({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn('flex items-center -space-x-px', className)}
      data-slot="input-otp-group"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPSlot
 * -------------------------------------------------------------------------- */

function InputOTPSlot({
  className,
  index,
  ...props
}: ComponentProps<'div'> & {
  index: number;
}): JSX.Element {
  const inputOTPContext = useContext(OTPInputContext);
  const { isActive, char, hasFakeCaret } = inputOTPContext.slots[index];

  return (
    <div
      className={cn(
        'border-input data-[active=true]:ring-3 data-[active=true]:border-ring data-[active=true]:ring-ring/50 not-has-disabled:shadow-xs outline-hidden data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive relative flex size-9 items-center justify-center border text-sm transition-all first:rounded-l-lg last:rounded-r-lg data-[active=true]:z-10',
        className,
      )}
      data-active={isActive}
      data-slot="input-otp-slot"
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground animation-duration-1000 h-4 w-px" />
        </div>
      ) : null}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPSeparator
 * -------------------------------------------------------------------------- */

function InputOTPSeparator({ ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <DotIcon />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
