import { DirectionProvider } from "@codefast/ui/direction";
import { cn } from "@codefast/ui/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import type { ReactNode } from "react";

import {
  LanguageProvider,
  LanguageSelector,
  useLanguageContext,
  useTranslation,
  type Translations,
} from "#/components/detail/language-selector";
import { CodeBlock } from "#/components/shared/code-block";

interface ExamplePreviewProps {
  /** Anchor id for deep-linking and the On-this-page TOC. */
  readonly id: string;
  readonly title: string;
  readonly description?: string | undefined;
  /** Raw source, shown in the Code tab and copied to the clipboard. */
  readonly code: string;
  /** Pre-highlighted Shiki HTML for `code`, produced in the route loader. */
  readonly highlightedCode: string;
  /** Extra classes for the live preview surface — alignment, height, padding. */
  readonly previewClassName?: string | undefined;
  /** Reading direction; `"rtl"` adds a language switcher and flips the layout. */
  readonly direction?: "ltr" | "rtl" | undefined;
  /** The live demo to render in the Preview tab. */
  readonly children: ReactNode;
}

/**
 * A single documented example: a titled block with a Preview / Code tab pair.
 * Used for every example on a component detail page, including the single
 * fallback example synthesised for components without rich docs yet.
 *
 * Dogfoods `@codefast/ui` Tabs so the docs site demonstrates the library itself.
 */
export function ExamplePreview({
  id,
  title,
  description,
  code,
  highlightedCode,
  previewClassName,
  direction = "ltr",
  children,
}: ExamplePreviewProps) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-3">
        <a href={`#${id}`} className="group/ex flex w-fit items-center gap-2 no-underline">
          <h3 className="text-sm font-semibold text-ui-fg">{title}</h3>
          <span aria-hidden className="text-xs text-ui-muted opacity-0 transition-opacity group-hover/ex:opacity-100">
            #
          </span>
        </a>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ui-muted">{description}</p> : null}
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-3">
          {direction === "rtl" ? (
            <LanguageProvider defaultLanguage="ar">
              <RtlPreviewSurface previewClassName={previewClassName}>{children}</RtlPreviewSurface>
            </LanguageProvider>
          ) : (
            <div
              className={cn(
                "flex min-h-56 flex-wrap items-center justify-center gap-3 rounded-2xl border border-ui-border bg-ui-surface p-10",
                previewClassName,
              )}
            >
              {children}
            </div>
          )}
        </TabsContent>

        <TabsContent value="code" className="mt-3">
          <div className="overflow-hidden rounded-2xl border border-ui-border">
            <CodeBlock code={code} highlightedCode={highlightedCode} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Tracks the document direction for the active language. */
const directionTranslations: Translations<Record<string, never>> = {
  en: { dir: "ltr", values: {} },
  ar: { dir: "rtl", values: {} },
  he: { dir: "rtl", values: {} },
};

/**
 * RTL preview chrome: a top toolbar with the language switcher, plus the demo
 * wrapped in a `DirectionProvider` so every Radix primitive inside flips. The
 * surface itself carries `dir` / `data-lang` so plain DOM and CSS flip too.
 */
function RtlPreviewSurface({
  previewClassName,
  children,
}: {
  previewClassName?: string | undefined;
  children: ReactNode;
}): ReactNode {
  const context = useLanguageContext();
  const { dir, language } = useTranslation(directionTranslations, "ar");

  return (
    <div className="overflow-hidden rounded-2xl border border-ui-border">
      <div className="flex items-center border-b border-ui-border px-4 py-2">
        {context ? <LanguageSelector value={context.language} onValueChange={context.setLanguage} /> : null}
        <p className="ms-auto text-xs text-ui-muted">
          Translations are AI-generated for demonstration and may be imperfect.
        </p>
      </div>
      <DirectionProvider dir={dir}>
        <div
          dir={dir}
          data-lang={dir === "rtl" ? language : undefined}
          className={cn(
            "flex min-h-56 flex-wrap items-center justify-center gap-3 bg-ui-surface p-10",
            previewClassName,
          )}
        >
          {children}
        </div>
      </DirectionProvider>
    </div>
  );
}
