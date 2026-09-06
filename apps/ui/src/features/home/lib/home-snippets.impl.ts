import type { HomeSnippets, TestBedSnippet } from "#/features/home/lib/home-snippets";
/** Server-only highlighter for the home page's code samples; each source file type-checks against the package it shows. */
import { highlightTsx } from "#/registry/_core/highlight-source.impl";

// Raw globs rather than `?raw` specifiers, which the import linter resolves as modules with no default export.
const rawSources = import.meta.glob<string>(
  [
    "./quick-start.source.ts",
    "../demos/shop-test.source.ts",
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

// A test starts where a line begins with `it("`; the text before the first one is the import block.
const TEST_START = /\n(?=it\(")/;
const TEST_TITLE = /^it\("([^"]+)"/;

/** The test file as the card shows it: the import block and each `it(...)` highlighted on its own. */
async function highlightTestFile(source: string): Promise<TestBedSnippet> {
  const [imports, ...tests] = source.trimEnd().split(TEST_START);
  const [importsHtml, ...testHtml] = await Promise.all([
    highlightTsx(imports?.trimEnd() ?? ""),
    ...tests.map((test) => highlightTsx(test.trimEnd())),
  ]);

  return {
    imports: importsHtml,
    tests: tests.map((test, index) => ({
      title: TEST_TITLE.exec(test)?.[1] ?? `test ${index + 1}`,
      html: testHtml[index] ?? "",
    })),
  };
}

/** Every home sample as dual-theme highlighted HTML. */
export async function highlightHomeSnippets(): Promise<HomeSnippets> {
  const [quickStart, testBed, rightList, wrongList, decorators] = await Promise.all([
    highlightTsx((rawSources["./quick-start.source.ts"] ?? "").trimEnd()),
    highlightTestFile(rawSources["../demos/shop-test.source.ts"] ?? ""),
    highlightTsx((rawSources["./right-list.sample.txt"] ?? "").trimEnd()),
    highlightTsx((rawSources["./wrong-list.sample.txt"] ?? "").trimEnd()),
    highlightTsx((rawSources["../demos/decorators.source.ts"] ?? "").trimEnd()),
  ]);

  return { quickStart, testBed, rightList, wrongList, decorators };
}
