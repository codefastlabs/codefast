import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { cn } from "@codefast/ui/lib/utils";
import { CodeBlock } from "#/components/code-block";

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
  children,
}: ExamplePreviewProps) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-3">
        <a href={`#${id}`} className="group/ex flex w-fit items-center gap-2 no-underline">
          <h3 className="text-sm font-semibold text-ui-fg">{title}</h3>
          <span
            aria-hidden
            className="text-xs text-ui-muted opacity-0 transition-opacity group-hover/ex:opacity-100"
          >
            #
          </span>
        </a>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ui-muted">{description}</p>
        ) : null}
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-3">
          <div
            className={cn(
              "flex min-h-56 flex-wrap items-center justify-center gap-3 rounded-2xl border border-ui-border bg-ui-surface p-10",
              previewClassName,
            )}
          >
            {children}
          </div>
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
