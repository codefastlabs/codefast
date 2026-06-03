import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@codefast/ui/input-otp";

export function InputOTPVerify() {
  const [value, setValue] = useState("");

  const complete = value.length === 6;
  const correct = value === "123456";

  return (
    <div className="flex flex-col items-center gap-4">
      <InputOTP maxLength={6} value={value} onChange={setValue}>
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
      <p className="text-sm">
        {!complete ? (
          <span className="text-ui-muted">Enter the 6-digit code — try 123456</span>
        ) : correct ? (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Verified ✓</span>
        ) : (
          <span className="font-medium text-rose-600 dark:text-rose-400">Incorrect code</span>
        )}
      </p>
    </div>
  );
}
