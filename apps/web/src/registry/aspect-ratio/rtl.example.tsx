import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { Image } from "@unpic/react";

import type { Translations } from "#/components/detail/language-selector";
import { useTranslation } from "#/components/detail/language-selector";

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
      <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
        <Image
          src="https://avatar.vercel.sh/codefast"
          alt="Photo"
          width={640}
          height={360}
          className="size-full w-full rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
      <figcaption className="mt-2 text-center text-sm text-muted-foreground">{t.caption}</figcaption>
    </figure>
  );
}
