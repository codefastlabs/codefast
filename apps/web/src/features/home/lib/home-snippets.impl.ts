import type { FoldedSnippet, HomeSnippets, TestBedSnippet } from "#/features/home/lib/home-snippets";
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

// The import block is the run of `import … ;` statements a sample opens with; a test starts where a line begins `it("`.
const IMPORTS = /^(?:import [^;]*;\n+)+/;
const TEST_START = /\n(?=it\(")/;
const TEST_TITLE = /^it\("([^"]+)"/;

/** A sample's import block and the rest, each trimmed; a sample without imports has an empty block. */
function splitImports(source: string): { imports: string; body: string } {
  const imports = IMPORTS.exec(source)?.[0] ?? "";

  return { imports: imports.trimEnd(), body: source.slice(imports.length).trim() };
}

/** A sample as its folded card shows it: the import block and the body highlighted on their own. */
async function highlightFolded(source: string): Promise<FoldedSnippet> {
  const { imports, body } = splitImports(source);
  const [importsHtml, bodyHtml] = await Promise.all([highlightTsx(imports), highlightTsx(body)]);

  return { imports: importsHtml, body: bodyHtml };
}

/** The test file as the card shows it: the import block and each `it(...)` highlighted on its own. */
async function highlightTestFile(source: string): Promise<TestBedSnippet> {
  const { imports, body } = splitImports(source);
  const tests = body.split(TEST_START);
  const [importsHtml, ...testHtml] = await Promise.all([
    highlightTsx(imports),
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
    highlightFolded((rawSources["../demos/decorators.source.ts"] ?? "").trimEnd()),
  ]);

  return { quickStart, testBed, rightList, wrongList, decorators };
}
