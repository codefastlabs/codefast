import { expect } from "storybook/test";

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS } from "#/components/input-otp";

import preview from "../.storybook/preview";

/**
 * OTPInput's props are a union (`render` XOR `children`), so binding `component`
 * makes `meta.story({ render })` resolve to `never`. Expose a flat custom args
 * shape and apply `maxLength`/`disabled` explicitly; keep `InputOTP` documented
 * via `subcomponents`.
 */
interface InputOtpArgs {
  disabled: boolean;
  maxLength: number;
}

const meta = preview.type<{ args: InputOtpArgs }>().meta({
  args: { disabled: false, maxLength: 6 },
  argTypes: {
    disabled: { control: "boolean" },
    maxLength: { control: "number" },
  },
  subcomponents: { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator },
  parameters: {
    docs: {
      description: {
        component: [
          "A segmented input for one-time passcodes and verification codes, one character per slot.",
          "",
          "**Anatomy:** `InputOTP > InputOTPGroup > InputOTPSlot` (with optional `InputOTPSeparator` between groups).",
          "Set `maxLength` to the code length; restrict input with patterns like `REGEXP_ONLY_DIGITS`.",
        ].join("\n"),
      },
    },
  },
  title: "Form/InputOtp",
});

export const Default = meta.story({
  render: ({ disabled, maxLength }) => (
    <div className="flex flex-col items-center gap-4">
      <InputOTP disabled={disabled} maxLength={maxLength}>
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
      <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to your phone.</p>
    </div>
  ),
});

export const FourDigits = meta.story({
  render: () => (
    <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <InputOTP maxLength={6} disabled value="123456">
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
  ),
});

export const TypingDigits = meta.story({
  render: FourDigits.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
TypingDigits.test("types digits", async ({ canvas, userEvent }) => {
  const input = canvas.getByRole("textbox");

  await userEvent.type(input, "1234");
  await expect(input).toHaveValue("1234");
});
