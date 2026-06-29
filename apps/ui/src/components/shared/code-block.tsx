import { ShikiSurface } from "#/components/shared/shiki-surface";

// Not a `ComponentProps` extension — forwards a curated subset, not arbitrary div attrs.
interface CodeBlockProps {
  /** Dual-theme highlighted HTML. */
  highlightedCode: string;
  showLineNumbers?: boolean | undefined;
}

/**
 * Presentational only — the copy button lives in the container
 * (`ExampleChrome`/`AnatomySection`) that holds the raw source.
 */
export function CodeBlock({ highlightedCode, showLineNumbers }: CodeBlockProps) {
  return <ShikiSurface html={highlightedCode} showLineNumbers={showLineNumbers} />;
}
