import { Slider } from "@codefast/ui/slider";

import type { Translations } from "#/components/detail/language";
import { useTranslation } from "#/components/detail/language-context";

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

export function SliderRtl() {
  const { dir } = useTranslation(translations, "ar");

  return <Slider defaultValue={[75]} max={100} step={1} className="mx-auto w-full max-w-xs" dir={dir} />;
}
