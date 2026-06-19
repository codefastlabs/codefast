import { cn } from "@codefast/ui/lib/utils";

interface CodeBlockProps {
  /** Pre-highlighted Shiki HTML for dark mode. */
  highlightedCodeDark: string;
  /** Pre-highlighted Shiki HTML for light mode. Falls back to dark-only when omitted. */
  highlightedCodeLight?: string | undefined;
}

/** A Shiki-highlighted HTML surface; `className` toggles light/dark visibility. */
function ShikiSurface({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-x-auto [&_.shiki]:overflow-x-auto [&_.shiki]:p-5 [&_.shiki]:text-xs [&_.shiki]:leading-relaxed [&_.shiki]:tab-2!",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders Shiki-highlighted source as light/dark HTML surfaces. Purely
 * presentational: the copy affordance belongs to the surrounding container
 * (`PreviewTabs`, `AnatomySection`), which holds the raw source and the
 * non-scrolling box an absolute `CopyButton` can stay pinned to.
 */
export function CodeBlock({ highlightedCodeDark, highlightedCodeLight }: CodeBlockProps) {
  if (highlightedCodeLight) {
    return (
      <>
        <ShikiSurface html={highlightedCodeLight} className="dark:hidden" />
        <ShikiSurface html={highlightedCodeDark} className="hidden dark:block" />
      </>
    );
  }

  return <ShikiSurface html={highlightedCodeDark} />;
}
