"use client";

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Label, REGEXP_ONLY_DIGITS } from "@codefast/ui";
import { type JSX, useId, useState } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

export function InputOTPDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div className="">
        <InputOTPSimple />
      </div>
      <div className="">
        <InputOTPPattern />
      </div>
      <div className="">
        <InputOTPWithSeparator />
      </div>
      <div className="">
        <InputOTPWithSpacing />
      </div>
    </GridWrapper>
  );
}

function InputOTPSimple(): JSX.Element {
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Simple</Label>
      <InputOTP id={id} maxLength={6}>
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
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Digits Only</Label>
      <InputOTP id={id} maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
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
  const [value, setValue] = useState("123456");
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>With Separator</Label>
      <InputOTP id={id} maxLength={6} value={value} onChange={setValue}>
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
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>With Spacing</Label>
      <InputOTP id={id} maxLength={6}>
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
