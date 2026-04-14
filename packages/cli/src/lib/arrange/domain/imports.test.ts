import { cnModuleSpecifierForFile } from "#lib/arrange/domain/imports";
import { ensureCnImport } from "#lib/arrange/infra/ensure-cn-import";

describe("cnModuleSpecifierForFile", () => {
  it("documents that default module specifier is stable across file paths", () => {
    expect(cnModuleSpecifierForFile("/repo/packages/ui/src/components/a.tsx")).toBe(
      "@codefast/tailwind-variants",
    );
    expect(cnModuleSpecifierForFile("/repo/packages/cli/src/lib/a.ts")).toBe(
      "@codefast/tailwind-variants",
    );
  });

  it("documents that explicit override always takes precedence", () => {
    expect(cnModuleSpecifierForFile("/repo/packages/ui/src/components/a.tsx", "clsx")).toBe("clsx");
  });
});

describe("ensureCnImport", () => {
  it("does not change source when cn is imported as default binding", () => {
    const source = 'import cn from "@codefast/tailwind-variants";\nconst x = 1;\n';
    expect(ensureCnImport(source, "/repo/x.ts")).toBe(source);
  });

  it("does not change source when cn already imported", () => {
    const source = 'import { cn, tv } from "@codefast/tailwind-variants";\nconst x = 1;\n';
    expect(ensureCnImport(source, "/repo/x.ts")).toBe(source);
  });

  it("injects cn into an existing named import from matching module", () => {
    const source = 'import { tv } from "clsx";\nconst x = 1;\n';
    const out = ensureCnImport(source, "/repo/x.ts", "clsx");
    expect(out).toContain('import { cn, tv } from "clsx";');
  });

  it("inserts after use client directive", () => {
    const source = '"use client";\n\nexport const x = 1;\n';
    const out = ensureCnImport(source, "/repo/x.tsx");
    expect(out.startsWith('"use client";\n\nimport { cn }')).toBe(true);
  });

  it("inserts before first import when no matching import exists", () => {
    const source = 'import { tv } from "clsx";\nconst x = 1;\n';
    const out = ensureCnImport(source, "/repo/x.ts");
    expect(out.indexOf('import { cn } from "@codefast/tailwind-variants";')).toBe(0);
  });

  it("inserts at file start when there are no imports", () => {
    const source = "const x = 1;\n";
    const out = ensureCnImport(source, "/repo/x.ts");
    expect(out.startsWith('import { cn } from "@codefast/tailwind-variants";\n')).toBe(true);
  });

  it("respects module override when adding new import", () => {
    const source = "const x = 1;\n";
    const out = ensureCnImport(source, "/repo/x.ts", "clsx");
    expect(out.startsWith('import { cn } from "clsx";\n')).toBe(true);
  });

  it("keeps existing legacy tailwind-variants import unchanged (backward compat)", () => {
    const source = 'import { cn, tv } from "tailwind-variants";\nconst x = 1;\n';
    expect(ensureCnImport(source, "/repo/x.ts")).toBe(source);
  });
});
