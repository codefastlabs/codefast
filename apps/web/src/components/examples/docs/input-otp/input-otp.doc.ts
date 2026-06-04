import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { InputOTPPattern } from "#/components/examples/docs/input-otp/pattern";
import { InputOTPVerify } from "#/components/examples/docs/input-otp/verify";

import { InputOTPDisabled } from "#/components/examples/docs/input-otp/disabled";

export const inputOtpDoc: ComponentDoc = {
  examples: [
    {
      id: "verify",
      title: "Verify a code",
      description: "Controlled value — the demo validates 123456 and reacts the moment all 6 land.",
      Demo: InputOTPVerify,
      code: docSource("input-otp", "verify"),
    },
    {
      id: "pattern",
      title: "Digits only",
      description: "Pass a pattern (REGEXP_ONLY_DIGITS) to reject non-matching keystrokes.",
      Demo: InputOTPPattern,
      code: docSource("input-otp", "pattern"),
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "A non-interactive code input.",
      Demo: InputOTPDisabled,
      code: docSource("input-otp", "disabled"),
    },
  ],
  anatomy: docAnatomy("input-otp"),
  api: [
    {
      name: "InputOTP",
      description: "One-time-code input built on input-otp.",
      props: [
        {
          name: "maxLength",
          type: "number",
          description: "Total number of slots (required).",
        },
        {
          name: "value / onChange",
          type: "string / (value: string) => void",
          description: "Controlled value — the concatenated characters.",
        },
        {
          name: "onComplete",
          type: "(value: string) => void",
          description: "Fires when every slot is filled.",
        },
        {
          name: "pattern",
          type: "string (RegExp source)",
          description: "Restrict input, e.g. REGEXP_ONLY_DIGITS.",
        },
      ],
    },
    {
      name: "InputOTPSlot / InputOTPSeparator",
      props: [
        {
          name: "index",
          type: "number",
          description: "On a slot: its position. Wrap groups with InputOTPGroup.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Arrow", "Left"], description: "Moves to the previous slot." },
      { keys: ["Arrow", "Right"], description: "Moves to the next slot." },
      { keys: ["Backspace"], description: "Clears the current slot and steps back." },
    ],
    notes: [
      "Renders a single hidden input — paste fills every slot at once.",
      'Set autoComplete="one-time-code" so mobile keyboards offer the SMS code.',
      "Always pair with a visible instruction telling users where the code came from.",
    ],
  },
  guidelines: {
    do: [
      "Match the slot count to the real code length.",
      "Group long codes (3 + 3) with a separator for readability.",
    ],
    dont: [
      "Don’t use OTP slots for general text — use Input.",
      "Don’t block paste; many users paste the code from another app.",
    ],
  },
  related: ["input", "input-password", "field"],
};
