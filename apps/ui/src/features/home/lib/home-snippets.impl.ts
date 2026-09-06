import type { HomeSnippets } from "#/features/home/lib/home-snippets";
/** Server-only highlighter for the home page's code samples; each source file type-checks against the package it shows. */
import { highlightTsx } from "#/registry/_core/highlight-source.impl";

// Raw globs rather than `?raw` specifiers, which the import linter resolves as modules with no default export.
const rawSources = import.meta.glob<string>(
  [
    "./quick-start.source.ts",
    "./test-bed.source.ts",
    "./right-list.sample.txt",
    "./wrong-list.sample.txt",
    "../demos/decorators.source.ts",
  ],
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);

/** Every home sample as dual-theme highlighted HTML. */
export async function highlightHomeSnippets(): Promise<HomeSnippets> {
  const [quickStart, testBed, rightList, wrongList, decorators] = await Promise.all([
    highlightTsx((rawSources["./quick-start.source.ts"] ?? "").trimEnd()),
    highlightTsx((rawSources["./test-bed.source.ts"] ?? "").trimEnd()),
    highlightTsx((rawSources["./right-list.sample.txt"] ?? "").trimEnd()),
    highlightTsx((rawSources["./wrong-list.sample.txt"] ?? "").trimEnd()),
    highlightTsx((rawSources["../demos/decorators.source.ts"] ?? "").trimEnd()),
  ]);

  return { quickStart, testBed, rightList, wrongList, decorators };
}
