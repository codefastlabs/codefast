import { describe, expect, it } from "vitest";

import { runImportsAudit } from "#audit/imports/run";
import { createAuditContext } from "#tests/unit/support/audit-context";

describe("runImportsAudit", () => {
  it("reports a namespace React import and an implicit UMD-global reference, and passes a clean file", async () => {
    const { context } = await createAuditContext({
      "apps/web/src/demo.tsx": `import * as React from "react";\nexport const x = React.version;\n`,
      "clean.tsx": `import { useState } from "react";\nexport const use = useState;\n`,
      "umd.ts": `export type H = React.FormEvent;\n`,
    });

    const outcome = runImportsAudit(context);

    expect(outcome.ok && outcome.value.scannedFiles).toBe(3);
    expect(outcome.ok && outcome.value.findings.map(({ file, text }) => `${file} ${text}`).toSorted()).toEqual([
      'apps/web/src/demo.tsx import * as React from "react";',
      "umd.ts React.FormEvent",
    ]);
  });

  it("applies the Zod namespace rule to every package, accepting only the namespace form", async () => {
    const { context } = await createAuditContext({
      "packages/theme/src/named.ts": `import { z } from "zod";\nexport const s = z.string();\n`,
      "packages/theme/src/namespace.ts": `import * as z from "zod";\nexport const s = z.string();\n`,
      "packages/cli/src/named.ts": `import { z } from "zod";\nexport const s = z.string();\n`,
    });

    const outcome = runImportsAudit(context);

    // The house form is repo-wide: every named import is flagged, backend `cli` included.
    expect(outcome.ok && outcome.value.findings.map(({ file }) => file).toSorted()).toEqual([
      "packages/cli/src/named.ts",
      "packages/theme/src/named.ts",
    ]);
    for (const finding of outcome.ok ? outcome.value.findings : []) {
      expect(finding.message).toContain('named import { z } from "zod"');
    }
  });
});
