import { ShikiSurface } from "#/components/shared/shiki-surface";

// Renders a fragment (light + dark surfaces), not a single host element, so the
// props are a plain named interface rather than an extension of `ComponentProps`.
interface CodeBlockProps {
  /** Pre-highlighted Shiki HTML for dark mode. */
  highlightedCodeDark: string;
  /** Pre-highlighted Shiki HTML for light mode. Falls back to dark-only when omitted. */
  highlightedCodeLight?: string | undefined;
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
