import { Calendar } from "@codefast/ui/calendar";
import { arSA, he } from "@daypicker/react/locale";
import * as React from "react";

import type { Translations } from "#/features/components-catalog/components/detail/language";
import { useTranslation } from "#/features/components-catalog/components/detail/language-context";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {},
  },
  ar: {
    dir: "rtl",
    values: {},
  },
  he: {
    dir: "rtl",
    values: {},
  },
};

const locales = {
  ar: arSA,
  he: he,
} as const;

export function CalendarRtl() {
  const { dir, language } = useTranslation(translations, "ar");
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border [--cell-size:--spacing(9)]"
      captionLayout="dropdown"
      dir={dir}
      locale={dir === "rtl" ? locales[language as keyof typeof locales] : undefined}
    />
  );
}
