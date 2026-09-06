/** Server-only highlighter for the hero's `@codefast/di` sample; the source file itself type-checks against the package. */
import { highlightTsx } from "#/registry/_core/highlight-source.impl";

// A raw glob rather than a `?raw` specifier, which the import linter resolves as a module with no default export.
const rawSources = import.meta.glob<string>("./hero-snippet.source.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

const source = rawSources["./hero-snippet.source.ts"] ?? "";

/** The hero sample as dual-theme highlighted HTML. */
export function highlightHeroSnippet(): Promise<string> {
  return highlightTsx(source.trimEnd());
}
