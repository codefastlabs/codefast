import { Button } from "@codefast/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";

import type { Translations } from "#/components/detail/language";
import { useTranslation } from "#/components/detail/language-context";

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      content: "Add to library",
      left: "Left",
      top: "Top",
      bottom: "Bottom",
      right: "Right",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      content: "إضافة إلى المكتبة",
      left: "يسار",
      top: "أعلى",
      bottom: "أسفل",
      right: "يمين",
    },
  },
  he: {
    dir: "rtl",
    values: {
      content: "הוסף לספרייה",
      left: "שמאל",
      top: "למעלה",
      bottom: "למטה",
      right: "ימין",
    },
  },
};

const sides = ["left", "top", "bottom", "right"] as const;

export function TooltipRtl() {
  const { t } = useTranslation(translations, "ar");

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {sides.map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline" className="w-fit capitalize">
                {t[side]}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>{t.content}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
