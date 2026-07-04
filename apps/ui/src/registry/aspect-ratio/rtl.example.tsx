import { AspectRatio } from "@codefast/ui/aspect-ratio";

import type { Translations } from "#/components/detail/language";
import { useTranslation } from "#/components/detail/language-context";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      caption: "Beautiful landscape",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      caption: "منظر طبيعي جميل",
    },
  },
  he: {
    dir: "rtl",
    values: {
      caption: "נוף יפה",
    },
  },
};

export function AspectRatioRtl() {
  const { dir, t } = useTranslation(translations, "ar");

  return (
    <figure className="w-full max-w-sm" dir={dir}>
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
        <div aria-label={t.caption} className="size-full bg-ui-surface" role="img" />
      </AspectRatio>
      <figcaption className="mt-2 text-center text-sm text-ui-muted">{t.caption}</figcaption>
    </figure>
  );
}
