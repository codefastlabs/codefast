import { InputOTP, InputOTPGroup, InputOTPSlot } from "@codefast/ui/input-otp";

export function InputOTPDisabled() {
  return (
    <div className="flex flex-col items-center gap-4">
      <InputOTP maxLength={4} disabled>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-ui-muted">Disabled while the code is being sent.</p>
    </div>
  );
}
