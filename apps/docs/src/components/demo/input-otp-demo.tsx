'use client';

import type { JSX } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Label, REGEXP_ONLY_DIGITS } from '@codefast/ui';
import { useState } from 'react';

import { GridWrapper } from '@/components/grid-wrapper';

export function InputOTPDemo(): JSX.Element {
  return (
    <GridWrapper>
      <InputOTPSimple />

      <InputOTPPattern />

      <InputOTPWithSeparator />

      <InputOTPWithSpacing />
    </GridWrapper>
  );
}

function InputOTPSimple(): JSX.Element {
  return (
    <div className="grid gap-2">
      <Label htmlFor="simple">Simple</Label>

      <InputOTP id="simple" maxLength={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />

          <InputOTPSlot index={1} />

          <InputOTPSlot index={2} />
        </InputOTPGroup>

        <InputOTPSeparator />

        <InputOTPGroup>
          <InputOTPSlot index={3} />

          <InputOTPSlot index={4} />

          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

function InputOTPPattern(): JSX.Element {
  return (
    <div className="grid gap-2">
      <Label htmlFor="digits-only">Digits Only</Label>

      <InputOTP id="digits-only" maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />

          <InputOTPSlot index={1} />

          <InputOTPSlot index={2} />

          <InputOTPSlot index={3} />

          <InputOTPSlot index={4} />

          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

function InputOTPWithSeparator(): JSX.Element {
  const [value, setValue] = useState('123456');

  return (
    <div className="grid gap-2">
      <Label htmlFor="with-separator">With Separator</Label>

      <InputOTP id="with-separator" maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />

          <InputOTPSlot index={1} />
        </InputOTPGroup>

        <InputOTPSeparator />

        <InputOTPGroup>
          <InputOTPSlot index={2} />

          <InputOTPSlot index={3} />
        </InputOTPGroup>

        <InputOTPSeparator />

        <InputOTPGroup>
          <InputOTPSlot index={4} />

          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

function InputOTPWithSpacing(): JSX.Element {
  return (
    <div className="grid gap-2">
      <Label htmlFor="with-spacing">With Spacing</Label>

      <InputOTP id="with-spacing" maxLength={6}>
        <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
          <InputOTPSlot aria-invalid="true" index={0} />

          <InputOTPSlot aria-invalid="true" index={1} />

          <InputOTPSlot aria-invalid="true" index={2} />

          <InputOTPSlot aria-invalid="true" index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
