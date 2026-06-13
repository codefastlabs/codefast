import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { arSA, he } from "@daypicker/react/locale";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import type { Translations } from "#/components/detail/language-selector";
import { useTranslation } from "#/components/detail/language-selector";

const translations: Translations = {
  en: { dir: "ltr", values: { placeholder: "Pick a date" } },
  ar: { dir: "rtl", values: { placeholder: "اختر تاريخًا" } },
  he: { dir: "rtl", values: { placeholder: "בחר תاريخًا" } },
};

const dayPickerLocales = { ar: arSA, he } as const;

/** BCP-47 tag for Intl date formatting, derived from the active language. */
const intlLocales: Record<string, string> = { ar: "ar-SA", he: "he-IL" };

export function DatePickerRtl() {
  const { dir, t, language } = useTranslation(translations, "ar");
  const [date, setDate] = useState<Date>();

  const dayPickerLocale = dir === "rtl" ? dayPickerLocales[language as keyof typeof dayPickerLocales] : undefined;
  const intlLocale = dir === "rtl" ? (intlLocales[language] ?? "en-US") : "en-US";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          dir={dir}
          data-empty={!date}
          className="w-[212px] justify-between text-start font-normal data-[empty=true]:text-muted-foreground"
        >
          {date ? (
            date.toLocaleDateString(intlLocale, { day: "numeric", month: "long", year: "numeric" })
          ) : (
            <span>{t.placeholder}</span>
          )}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" dir={dir} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          dir={dir}
          locale={dayPickerLocale}
          {...(date ? { defaultMonth: date } : {})}
        />
      </PopoverContent>
    </Popover>
  );
}
