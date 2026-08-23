import { describe, expect, it } from "vitest";

import { auditReactImportSource } from "#/audit/domain/react-imports";

describe("auditReactImportSource", () => {
  it("flags a namespace React import", () => {
    const violations = auditReactImportSource("a.tsx", `import * as React from "react";\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      line: 1,
      raw: `import * as React from "react";`,
    });
    expect(violations[0]?.reason).toContain("namespace React import");
  });

  it("flags a default React import, type-only included", () => {
    const value = auditReactImportSource("a.tsx", `import React from "react";\n`);
    expect(value).toHaveLength(1);
    expect(value[0]?.reason).toContain("default React import");

    const typeOnly = auditReactImportSource("a.tsx", `import type React from "react";\n`);
    expect(typeOnly).toHaveLength(1);
    expect(typeOnly[0]?.reason).toContain("default React import");
  });

  it("flags a type-only namespace React import", () => {
    const violations = auditReactImportSource("a.tsx", `import type * as React from "react";\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("namespace React import");
  });

  it("accepts named imports and non-react namespace imports", () => {
    const source = [
      `import * as TooltipPrimitive from "radix-ui/tooltip";`,
      `import { useState } from "react";`,
      `import type { ComponentProps } from "react";`,
      ``,
    ].join("\n");
    expect(auditReactImportSource("a.tsx", source)).toEqual([]);
  });

  it("flags an implicit React.* UMD-global type reference with its line", () => {
    const source = [
      `export function handle(e: React.FormEvent<HTMLFormElement>) {`,
      `  e.preventDefault();`,
      `}`,
      `export type Style = React.CSSProperties;`,
      ``,
    ].join("\n");
    const violations = auditReactImportSource("a.ts", source);
    expect(violations).toHaveLength(2);
    expect(violations[0]).toMatchObject({ line: 1, raw: "React.FormEvent" });
    expect(violations[1]).toMatchObject({ line: 4, raw: "React.CSSProperties" });
    expect(violations[0]?.reason).toContain("UMD global");
  });

  it("flags a nested UMD qualified name once", () => {
    const violations = auditReactImportSource("a.ts", `export type E = React.JSX.Element;\n`);
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
    const violations = auditReactImportSource("a.tsx", source);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("namespace React import");
  });

  it("ignores React.* mentions inside strings and comments", () => {
    const source = [
      `// React.lazy hydrates the preview in place`,
      `export const label = "React.ChangeEventHandler<HTMLInputElement>";`,
      ``,
    ].join("\n");
    expect(auditReactImportSource("a.ts", source)).toEqual([]);
  });
});
