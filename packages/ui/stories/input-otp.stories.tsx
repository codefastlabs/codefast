import { expect } from "storybook/test";

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS } from "#/components/input-otp";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: InputOTP,
  subcomponents: { InputOTPGroup, InputOTPSlot, InputOTPSeparator },
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
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <InputOTP maxLength={6}>
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
