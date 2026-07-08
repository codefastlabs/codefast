import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

import { CodeBlock } from "#/components/shared/code-block";
import { ExampleChrome } from "#/components/shared/example-chrome";
import { LanguageProvider } from "#/features/components-catalog/components/detail/language-context";
import { PreviewSurface } from "#/features/components-catalog/components/detail/preview-surface";
import { RtlPreviewSurface } from "#/features/components-catalog/components/detail/rtl-preview-surface";

interface ExamplePreviewProps extends ComponentProps<"div"> {
  /** Anchor id for deep-linking and the On-this-page TOC. */
  readonly id: string;
  readonly title: string;
  readonly description?: string | undefined;
  /** Raw source, shown in the Code tab and copied to the clipboard. */
  readonly code: string;
  /** Pre-highlighted dual-theme Shiki HTML for `code`, produced in the route loader. */
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
  className,
  ...props
}: ExamplePreviewProps) {
  return (
    <div id={id} className={cn("scroll-mt-anchor", className)} {...props}>
      <div className="mb-3">
        <a href={`#${id}`} className="group/ex flex w-fit items-center gap-2 no-underline">
          <h3 className="text-sm font-semibold text-ui-fg">{title}</h3>
          <span aria-hidden className="text-xs text-ui-muted opacity-0 transition-opacity group-hover/ex:opacity-100">
            #
          </span>
        </a>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ui-muted">{description}</p> : null}
      </div>

      <ExampleChrome
        copyText={code}
        analyticsName={id}
        preview={
          direction === "rtl" ? (
            <LanguageProvider defaultLanguage="ar">
              <RtlPreviewSurface previewClassName={previewClassName}>{children}</RtlPreviewSurface>
            </LanguageProvider>
          ) : (
            <PreviewSurface className={previewClassName}>{children}</PreviewSurface>
          )
        }
        code={<CodeBlock highlightedCode={highlightedCode} showLineNumbers />}
      />
    </div>
  );
}
