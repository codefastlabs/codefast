import { REGEXP_ONLY_DIGITS, InputOTP, InputOTPGroup, InputOTPSlot } from "@codefast/ui/input-otp";

export function InputOTPPattern() {
  return (
    <div className="flex flex-col items-center gap-4">
      <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-ui-muted">Digits only — letters are rejected as you type.</p>
    </div>
  );
}
