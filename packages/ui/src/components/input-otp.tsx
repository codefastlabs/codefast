'use client';

import type { ComponentProps, JSX } from 'react';

import { OTPInput, OTPInputContext } from 'input-otp';
import { DotIcon } from 'lucide-react';
import { useContext } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: InputOtp
 * -------------------------------------------------------------------------- */

type InputOTPProps = ComponentProps<typeof OTPInput>;

function InputOTP({ className, containerClassName, ...props }: InputOTPProps): JSX.Element {
  return (
    <OTPInput
      className={cn(className)}
      containerClassName={cn('flex items-center gap-2', 'has-[:disabled]:opacity-50', containerClassName)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPGroup
 * -------------------------------------------------------------------------- */

type InputOTPGroupProps = ComponentProps<'div'>;

function InputOTPGroup({ className, ...props }: InputOTPGroupProps): JSX.Element {
  return <div className={cn('flex items-center -space-x-px', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: InputOTPSlot
 * -------------------------------------------------------------------------- */

interface InputOTPSlotProps extends ComponentProps<'div'> {
  index: number;
}

function InputOTPSlot({ className, index, ...props }: InputOTPSlotProps): JSX.Element {
  const inputOTPContext = useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];

  return (
    <div
      className={cn(
        'border-input shadow-xs relative flex size-10 items-center justify-center border text-sm transition-all',
        'first:rounded-l-md',
        'last:rounded-r-md',
        'data-[state=active]:ring-3 data-[state=active]:ring-ring data-[state=active]:border-ring data-[state=active]:z-10',
        className,
      )}
      data-state={slot.isActive ? 'active' : 'inactive'}
      {...props}
    >
      {slot.char}
      {slot.hasFakeCaret ? (
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

type InputOTPSeparatorProps = ComponentProps<'div'>;

function InputOTPSeparator({ ...props }: InputOTPSeparatorProps): JSX.Element {
  return (
    <div role="separator" {...props}>
      <DotIcon />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { InputOTPGroupProps, InputOTPProps, InputOTPSeparatorProps, InputOTPSlotProps };
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };

export { REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
