import { InputOTPAlphanumeric } from "#/registry/input-otp/alphanumeric.example";
import { InputOTPControlled } from "#/registry/input-otp/controlled.example";
import { InputOTPDisabled } from "#/registry/input-otp/disabled.example";
import { InputOTPForm } from "#/registry/input-otp/form.example";
import { InputOTPFourDigits } from "#/registry/input-otp/four-digits.example";
import { InputOTPInvalid } from "#/registry/input-otp/invalid.example";
import { InputOTPPattern } from "#/registry/input-otp/pattern.example";
import { InputOTPRtl } from "#/registry/input-otp/rtl.example";
import { InputOTPWithSeparator } from "#/registry/input-otp/separator.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const inputOtpDoc: ComponentDoc = {
  examples: [
    {
      id: "pattern",
      title: "Digits only",
      description: "Pass a pattern (REGEXP_ONLY_DIGITS) to reject non-matching keystrokes.",
      Demo: InputOTPPattern,
      source: docSource("input-otp", "pattern"),
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "A non-interactive code input.",
      Demo: InputOTPDisabled,
      source: docSource("input-otp", "disabled"),
    },
    {
      id: "input-otp-alphanumeric",
      title: "Alphanumeric",
      description: "Use REGEXP_ONLY_DIGITS_AND_CHARS to accept both letters and numbers.",
      Demo: InputOTPAlphanumeric,
      source: docSource("input-otp", "alphanumeric"),
    },
    {
      id: "input-otp-controlled",
      title: "Controlled",
      description: "Use the value and onChange props to control the input value.",
      Demo: InputOTPControlled,
      source: docSource("input-otp", "controlled"),
    },
    {
      id: "input-otp-form",
      title: "Form",
      description: "Accessible one-time password component with copy-paste functionality.",
      Demo: InputOTPForm,
      source: docSource("input-otp", "form"),
    },
    {
      id: "input-otp-four-digits",
      title: "Four Digits",
      description: "A common pattern for PIN codes. This uses the pattern={REGEXP_ONLY_DIGITS} prop.",
      Demo: InputOTPFourDigits,
      source: docSource("input-otp", "four-digits"),
    },
    {
      id: "input-otp-invalid",
      title: "Invalid",
      description: "Use aria-invalid on the slots to show an error state.",
      Demo: InputOTPInvalid,
      source: docSource("input-otp", "invalid"),
    },
    {
      id: "input-otp-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: InputOTPRtl,
      source: docSource("input-otp", "rtl"),
      direction: "rtl",
    },
    {
      id: "input-otp-separator",
      title: "Separator",
      description: "Use the <InputOTPSeparator /> component to add a separator between input groups.",
      Demo: InputOTPWithSeparator,
      source: docSource("input-otp", "separator"),
    },
  ],
  anatomy: [{ name: "InputOTP", children: [{ name: "InputOTPGroup", children: [{ name: "InputOTPSlot" }] }] }],
  features: [
    "Renders a single hidden <input> under the hood — pasting a full code fills every slot at once, no per-slot paste handling needed.",
    "Ships REGEXP_ONLY_DIGITS, REGEXP_ONLY_CHARS, and REGEXP_ONLY_DIGITS_AND_CHARS (re-exported from input-otp) for the pattern prop.",
    "onComplete fires once every slot is filled, separate from the per-keystroke onChange.",
    "InputOTPSeparator drops a visual divider between groups (e.g. 3 + 3 for a 6-digit code) without affecting the value.",
  ],
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
    do: ["Match the slot count to the real code length.", "Group long codes (3 + 3) with a separator for readability."],
    dont: [
      "Don’t use OTP slots for general text — use Input.",
      "Don’t block paste; many users paste the code from another app.",
    ],
  },
  related: ["input", "input-password", "field"],
};
