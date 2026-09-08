import { describe, expect, it } from "vitest";

import { auditImportPolicySource, defaultImportPolicyRules } from "#/audit/domain/import-policy";

function audit(filePath: string, source: string) {
  return auditImportPolicySource(filePath, source, defaultImportPolicyRules);
}

describe("auditImportPolicySource — React", () => {
  it("flags a namespace React import", () => {
    const violations = audit("a.tsx", `import * as React from "react";\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ line: 1, raw: `import * as React from "react";` });
    expect(violations[0]?.reason).toContain('namespace import of "react"');
  });

  it("flags a default React import, type-only included", () => {
    const value = audit("a.tsx", `import React from "react";\n`);
    expect(value).toHaveLength(1);
    expect(value[0]?.reason).toContain('default import of "react"');

    const typeOnly = audit("a.tsx", `import type React from "react";\n`);
    expect(typeOnly).toHaveLength(1);
    expect(typeOnly[0]?.reason).toContain('default import of "react"');
  });

  it("flags a type-only namespace React import", () => {
    const violations = audit("a.tsx", `import type * as React from "react";\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain('namespace import of "react"');
  });

  it("accepts named imports and non-react namespace imports", () => {
    const source = [
      `import * as TooltipPrimitive from "radix-ui/tooltip";`,
      `import { useState } from "react";`,
      `import type { ComponentProps } from "react";`,
      ``,
    ].join("\n");
    expect(audit("a.tsx", source)).toEqual([]);
  });

  it("flags an implicit React.* UMD-global type reference with its line", () => {
    const source = [
      `export function handle(e: React.FormEvent<HTMLFormElement>) {`,
      `  e.preventDefault();`,
      `}`,
      `export type Style = React.CSSProperties;`,
      ``,
    ].join("\n");
    const violations = audit("a.ts", source);
    expect(violations).toHaveLength(2);
    expect(violations[0]).toMatchObject({ line: 1, raw: "React.FormEvent" });
    expect(violations[1]).toMatchObject({ line: 4, raw: "React.CSSProperties" });
    expect(violations[0]?.reason).toContain("UMD global");
  });

  it("flags a nested UMD qualified name once", () => {
    const violations = audit("a.ts", `export type E = React.JSX.Element;\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.raw).toBe("React.JSX");
  });

  it("reports only the import when a bound React also has qualified-name usages", () => {
    const source = [
      `import * as React from "react";`,
      `export function handle(e: React.FormEvent) {`,
      `  e.preventDefault();`,
      `}`,
      ``,
    ].join("\n");
    const violations = audit("a.tsx", source);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain('namespace import of "react"');
  });

  it("ignores React.* mentions inside strings and comments", () => {
    const source = [
      `// React.lazy hydrates the preview in place`,
      `export const label = "React.ChangeEventHandler<HTMLInputElement>";`,
      ``,
    ].join("\n");
    expect(audit("a.ts", source)).toEqual([]);
  });
});

describe("auditImportPolicySource — Zod", () => {
  it('flags a named `import { z } from "zod"`', () => {
    const violations = audit("a.ts", `import { z } from "zod";\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ line: 1, raw: `import { z } from "zod";` });
    expect(violations[0]?.reason).toContain('named import { z } from "zod"');
  });

  it('accepts the namespace form `import * as z from "zod"`', () => {
    expect(audit("a.ts", `import * as z from "zod";\n`)).toEqual([]);
  });

  it("accepts other named Zod exports and type-only Zod imports", () => {
    const source = [`import { object, string } from "zod";`, `import type { ZodType } from "zod";`, ``].join("\n");
    expect(audit("a.ts", source)).toEqual([]);
  });
});
