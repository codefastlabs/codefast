import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@codefast/ui/avatar";

import type { Translations } from "#/components/detail/language-selector";
import { useTranslation } from "#/components/detail/language-selector";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      moreUsers: "+3",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      moreUsers: "+٣",
    },
  },
  he: {
    dir: "rtl",
    values: {
      moreUsers: "+3",
    },
  },
};

export function AvatarRtl() {
  const { dir, t } = useTranslation(translations, "ar");

  return (
    <div className="flex flex-row flex-wrap items-center gap-6 md:gap-12" dir={dir}>
      <Avatar>
        <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" className="grayscale" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://avatar.vercel.sh/ava" alt="@ava" />
        <AvatarFallback>ER</AvatarFallback>
        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
      </Avatar>
      <AvatarGroup className="grayscale">
        <Avatar>
          <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://avatar.vercel.sh/leo" alt="@leo" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://avatar.vercel.sh/ava" alt="@ava" />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>{t.moreUsers}</AvatarGroupCount>
      </AvatarGroup>
    </div>
  );
}
