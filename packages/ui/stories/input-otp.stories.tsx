import { expect } from "storybook/test";

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS } from "#/components/input-otp";

import preview from "../.storybook/preview";

/**
 * InputOtp — a COMPOSITE whose root (`OTPInput`) prop type is a `render` XOR
 * `children` union, so binding `component` + `render: (args) => ...` makes args
 * resolve to `never`. Use the FLAT-ARGS workaround: a custom `InputOtpArgs`
 * shape drives `maxLength`/`disabled`, and the real parts stay documented via
 * `subcomponents`. Content is authored for Storybook, NOT synced with the
 * apps/web registry.
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
  subcomponents: { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot },
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

// States of the same composition — differ ONLY by args, reusing Default's render.
export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

// A genuinely different composition: a single 4-slot group restricted to digits.
export const FourDigits = meta.story({
  args: { maxLength: 4 },
  render: ({ disabled, maxLength }) => (
    <InputOTP disabled={disabled} maxLength={maxLength} pattern={REGEXP_ONLY_DIGITS}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  ),
});

export const TypingDigits = meta.story({
  args: { maxLength: 4 },
  render: FourDigits.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
TypingDigits.test("typed digits land in each slot and the field value updates", async ({ canvas, userEvent }) => {
  const input = canvas.getByRole("textbox");

  await userEvent.type(input, "1234");

  // Contract: the hidden input holds the full code, and each slot renders its char.
  await expect(input).toHaveValue("1234");

  for (const char of ["1", "2", "3", "4"]) {
    await expect(canvas.getByText(char)).toBeInTheDocument();
  }
});
