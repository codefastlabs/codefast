import { Field, FieldLabel } from "@codefast/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@codefast/ui/input-otp";
import { useState } from "react";

import type { Translations } from "#/features/components-catalog/components/detail/language";
import { useTranslation } from "#/features/components-catalog/components/detail/language-context";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      verificationCode: "Verification code",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      verificationCode: "رمز التحقق",
    },
  },
  he: {
    dir: "rtl",
    values: {
      verificationCode: "קוד אימות",
    },
  },
};

export function InputOTPRtl() {
  const { dir, t } = useTranslation(translations, "ar");
  const [value, setValue] = useState("123456");

  return (
    <Field className="mx-auto max-w-xs">
      <FieldLabel htmlFor="input-otp-rtl">{t.verificationCode}</FieldLabel>
      <InputOTP dir={dir} id="input-otp-rtl" maxLength={6} onChange={setValue} value={value}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </Field>
  );
}
