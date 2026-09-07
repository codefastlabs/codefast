import { Skeleton } from "@codefast/ui/skeleton";

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

export function SkeletonRtl() {
  const { dir } = useTranslation(translations, "ar");

  return (
    <div className="flex items-center gap-4" dir={dir}>
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-62.5" />
        <Skeleton className="h-4 w-50" />
      </div>
    </div>
  );
}
