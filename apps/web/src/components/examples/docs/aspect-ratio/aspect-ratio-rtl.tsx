import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { useTranslation, type Translations } from "#/components/docs/language-selector";

const translations: Translations = {
  en: { dir: "ltr", values: { caption: "Beautiful landscape" } },
  ar: { dir: "rtl", values: { caption: "منظر طبيعي جميل" } },
  he: { dir: "rtl", values: { caption: "נוף יפה" } },
};

export function AspectRatioRtl() {
  const { t } = useTranslation(translations, "ar");

  return (
    <figure className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
        <img
          src="https://avatar.vercel.sh/shadcn1"
          alt="Landscape"
          className="size-full rounded-lg object-cover grayscale dark:brightness-[0.2]"
        />
      </AspectRatio>
      <figcaption className="mt-2 text-center text-sm text-muted-foreground">
        {t.caption}
      </figcaption>
    </figure>
  );
}
