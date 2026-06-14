import { describe, expect, it } from "vitest";

import {
  buildGroupFileUnwrapState,
  mergeGroupFileBodyText,
  tryBuildGroupFileWorkPlan,
} from "#/arrange/domain/grouping-service";
import { parseDomainSourceFile } from "#/arrange/source-parse";

function applyArrange(filePath: string, sourceText: string): string {
  const domainSfInitial = parseDomainSourceFile(filePath, sourceText);
  const unwrap = buildGroupFileUnwrapState(domainSfInitial, sourceText);
  const domainSfGrouped = parseDomainSourceFile(filePath, unwrap.textAfterUnwrap);
  const work = tryBuildGroupFileWorkPlan({
    filePath,
    sourceText,
    domainSfInitial,
    domainSfGrouped,
    withClassName: false,
    unwrap,
  });
  return work === null ? sourceText : mergeGroupFileBodyText(work);
}

describe("arrange tv slot grouping", () => {
  it("wraps a bare string slot in an array instead of duplicating the property key", () => {
    const source = [
      `import { tv } from "#/lib/utils";`,
      ``,
      `const variants = tv({`,
      `  slots: {`,
      `    stepperButton: "h-auto min-w-0 rounded-none px-0 text-muted-foreground",`,
      `  },`,
      `});`,
      ``,
    ].join("\n");

    const result = applyArrange("/virtual/variants.ts", source);

    // The slot key must appear exactly once — the previous bug emitted three
    // duplicate `stepperButton:` properties, which is invalid TypeScript.
    expect(result.match(/stepperButton:/g)).toHaveLength(1);
    expect(result).toContain("stepperButton: [");

    // No Tailwind class may be lost when splitting across concern groups.
    for (const cls of ["h-auto", "min-w-0", "rounded-none", "px-0", "text-muted-foreground"]) {
      expect(result).toContain(cls);
    }
  });

  it("preserves an existing multi-element array slot as an array", () => {
    const source = [
      `import { tv } from "#/lib/utils";`,
      ``,
      `const variants = tv({`,
      `  slots: {`,
      `    field: [`,
      `      "h-full min-w-0 flex-1 px-3 py-1",`,
      `      "bg-transparent outline-none text-muted-foreground",`,
      `    ],`,
      `  },`,
      `});`,
      ``,
    ].join("\n");

    const result = applyArrange("/virtual/variants.ts", source);

    expect(result.match(/field:/g)).toHaveLength(1);
    expect(result).toContain("field: [");
  });
});
