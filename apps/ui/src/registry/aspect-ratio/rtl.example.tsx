import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { Image } from "@unpic/react";

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
        <Image
          alt={t.caption}
          className="size-full object-cover grayscale dark:brightness-20"
          height={360}
          layout="constrained"
          src="https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=640&q=80"
          width={640}
        />
      </AspectRatio>
      <figcaption className="mt-2 text-center text-sm text-ui-muted">{t.caption}</figcaption>
    </figure>
  );
}
