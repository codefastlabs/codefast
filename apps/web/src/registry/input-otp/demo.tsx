import { InputOTP, InputOTPGroup, InputOTPSlot } from "@codefast/ui/input-otp";
import { useState } from "react";

export function InputOTPDemo() {
  const [value, setValue] = useState("123456");

  return (
    <InputOTP maxLength={6} onChange={setValue} value={value}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
