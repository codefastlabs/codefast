import { ResizableSeparator, ResizablePanel, ResizableGroup } from "@codefast/ui/resizable";

import type { Translations } from "#/components/detail/language-selector";
import { useTranslation } from "#/components/detail/language-selector";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      one: "One",
      two: "Two",
      three: "Three",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      one: "واحد",
      two: "اثنان",
      three: "ثلاثة",
    },
  },
  he: {
    dir: "rtl",
    values: {
      one: "אחד",
      two: "שניים",
      three: "שלושה",
    },
  },
};

export function ResizableRtl() {
  const { dir, t } = useTranslation(translations, "ar");

  return (
    <ResizableGroup orientation="horizontal" className="max-w-sm rounded-lg border" dir={dir}>
      <ResizablePanel defaultSize="50%">
        <div className="flex h-50 items-center justify-center p-6">
          <span className="font-semibold">{t.one}</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator withHandle />
      <ResizablePanel defaultSize="50%">
        <ResizableGroup orientation="vertical" dir={dir}>
          <ResizablePanel defaultSize="25%">
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">{t.two}</span>
            </div>
          </ResizablePanel>
          <ResizableSeparator withHandle />
          <ResizablePanel defaultSize="75%">
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">{t.three}</span>
            </div>
          </ResizablePanel>
        </ResizableGroup>
      </ResizablePanel>
    </ResizableGroup>
  );
}
