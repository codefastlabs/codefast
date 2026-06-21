import { DirectionProvider } from "@codefast/ui/direction";
import type { ComponentProps, ReactNode } from "react";

import type { Translations } from "#/components/detail/language";
import { useLanguageContext, useTranslation } from "#/components/detail/language-context";
import { LanguageSelector } from "#/components/detail/language-selector";
import { PreviewSurface } from "#/components/detail/preview-surface";

/** Tracks the document direction for the active language. */
const directionTranslations: Translations<Record<string, never>> = {
  en: { dir: "ltr", values: {} },
  ar: { dir: "rtl", values: {} },
  he: { dir: "rtl", values: {} },
};

interface RtlPreviewSurfaceProps extends ComponentProps<"div"> {
  readonly previewClassName?: string | undefined;
}

/**
 * RTL preview chrome: a top toolbar with the language switcher, plus the demo
 * wrapped in a `DirectionProvider` so every Radix primitive inside flips.
 */
export function RtlPreviewSurface({ previewClassName, children, ...props }: RtlPreviewSurfaceProps): ReactNode {
  const context = useLanguageContext();
  const { dir, language } = useTranslation(directionTranslations, "ar");

  return (
    <div {...props}>
      <div className="flex items-center border-b border-ui-border/60 px-4 py-2">
        {context ? <LanguageSelector value={context.language} onValueChange={context.setLanguage} /> : null}
        <p className="ms-auto text-xs text-ui-muted">
          Translations are AI-generated for demonstration and may be imperfect.
        </p>
      </div>
      <DirectionProvider dir={dir}>
        <PreviewSurface dir={dir} data-lang={dir === "rtl" ? language : undefined} className={previewClassName}>
          {children}
        </PreviewSurface>
      </DirectionProvider>
    </div>
  );
}
