import { Separator } from "@codefast/ui/separator";

import type { Translations } from "#/components/detail/language";
import { useTranslation } from "#/components/detail/language-context";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      title: "codefast/ui",
      subtitle: "The Foundation for your Design System",
      description: "A set of beautifully designed components that you can customize, extend, and build on.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      title: "codefast/ui",
      subtitle: "الأساس لنظام التصميم الخاص بك",
      description: "مجموعة من المكونات المصممة بشكل جميل يمكنك تخصيصها وتوسيعها والبناء عليها.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      title: "codefast/ui",
      subtitle: "הבסיס למערכת העיצוב שלך",
      description: "סט של רכיבים מעוצבים בצורה יפה שאתה יכול להתאים אישית, להרחיב ולבנות עליהם.",
    },
  },
};

export function SeparatorRtl() {
  const { dir, t } = useTranslation(translations, "ar");

  return (
    <div className="flex max-w-sm flex-col gap-4 text-sm" dir={dir}>
      <div className="flex flex-col gap-1.5">
        <div className="leading-none font-medium">{t.title}</div>
        <div className="text-muted-foreground">{t.subtitle}</div>
      </div>
      <Separator />
      <div>{t.description}</div>
    </div>
  );
}
