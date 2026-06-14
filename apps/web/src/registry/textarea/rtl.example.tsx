import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import { Textarea } from "@codefast/ui/textarea";

import type { Translations } from "#/components/detail/language-selector";
import { useTranslation } from "#/components/detail/language-selector";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      label: "Feedback",
      placeholder: "Your feedback helps us improve...",
      description: "Share your thoughts about our service.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      label: "التعليقات",
      placeholder: "تعليقاتك تساعدنا على التحسين...",
      description: "شاركنا أفكارك حول خدمتنا.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      label: "משוב",
      placeholder: "המשוב שלך עוזר לנו להשתפר...",
      description: "שתף את מחשבותיך על השירות שלנו.",
    },
  },
};

export function TextareaRtl() {
  const { dir, t } = useTranslation(translations, "ar");

  return (
    <Field className="w-full max-w-xs" dir={dir}>
      <FieldLabel htmlFor="feedback" dir={dir}>
        {t.label}
      </FieldLabel>
      <Textarea id="feedback" placeholder={t.placeholder} dir={dir} rows={4} />
      <FieldDescription dir={dir}>{t.description}</FieldDescription>
    </Field>
  );
}
