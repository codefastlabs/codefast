/**
 * Integration Test: covers ArrangeFileProcessorServiceImpl, DomainSourceParserAdapter, and
 * group-file preview presentation (printGroupFilePreviewFromWork) against real filesystem fixtures.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ArrangeFileProcessorServiceImpl } from "#/lib/arrange/application/services/arrange-file-processor.service";
import { DomainSourceParserAdapter } from "#/lib/arrange/infra/domain-source-parser.adapter";
import { NodeCliFsAdapter, NodeCliLoggerAdapter } from "#/lib/infra/node-io.adapter";
import { printGroupFilePreviewFromWork } from "#/lib/arrange/presentation/group-file-preview.presenter";

const arrangeFs = new NodeCliFsAdapter();
const arrangeLogger = new NodeCliLoggerAdapter();
const service = new ArrangeFileProcessorServiceImpl(arrangeFs, new DomainSourceParserAdapter());

function withTempFixture(name: string, source: string, fn: (filePath: string) => void): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "group-file-"));
  const filePath = path.join(dir, name);
  try {
    fs.writeFileSync(filePath, source, "utf8");
    fn(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function captureStdout(fn: () => void): string {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  });
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
  return chunks.join("");
}

describe("ArrangeFileProcessorServiceImpl", () => {
  it("unwraps cn() inside tv base into string/array form", () => {
    const before = `import { cn, tv } from "@codefast/tailwind-variants";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium"),
});
`;
    withTempFixture("FixtureTv.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      const after = fs.readFileSync(filePath, "utf8");
      expect(result.changed).toBeGreaterThan(0);
      expect(after.includes("base: cn(")).toBe(false);
      expect(after).toMatch(/base:\s*(\[|"[^"]+)/);
    });
  });

  it("converts long JSX className and inserts cn import after use client", () => {
    const before = `"use client";

export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    withTempFixture("FixtureUseClient.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      const after = fs.readFileSync(filePath, "utf8");
      expect(result.changed).toBeGreaterThan(0);
      expect(after.startsWith(`"use client";\n\nimport { cn }`)).toBe(true);
      expect(after).toContain("className={cn(");
    });
  });

  it("supports namespace imports for tw.tv / tw.cn and rewrites tw.cn usage", () => {
    const before = `import * as tw from "@codefast/tailwind-variants";

export const styles = tw.tv({
  base: tw.cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureNamespace.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      const after = fs.readFileSync(filePath, "utf8");
      expect(result.changed).toBeGreaterThan(0);
      expect(after).toContain("tw.tv(");
      expect(after.includes("tw.cn(")).toBe(false);
      expect(after).toMatch(/base:\s*(\[|"[^"]+)/);
    });
  });

  it("supports namespace imports from legacy tailwind-variants package (backward compat)", () => {
    const before = `import * as tw from "tailwind-variants";

export const styles = tw.tv({
  base: tw.cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureNamespaceLegacy.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      const after = fs.readFileSync(filePath, "utf8");
      expect(result.changed).toBeGreaterThan(0);
      expect(after).toContain("tw.tv(");
      expect(after.includes("tw.cn(")).toBe(false);
      expect(after).toMatch(/base:\s*(\[|"[^"]+)/);
    });
  });

  it("recognizes cn/tv imports from local ./utils re-export", () => {
    const before = `import { cn, tv } from "./utils";
export const styles = tv({ base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent") });`;
    withTempFixture("FixtureLocalUtils.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      expect(result.changed).toBeGreaterThan(0);
    });
  });

  it("recognizes cn/tv imports from modules containing /utils/", () => {
    const before = `import { cn, tv } from "pkg/utils/cn";
export const styles = tv({ base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent") });`;
    withTempFixture("FixtureUtilsPath.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      expect(result.changed).toBeGreaterThan(0);
    });
  });

  it("recognizes cn/tv imports from ./cn.ts shim", () => {
    const before = `import { cn, tv } from "./cn.ts";
export const styles = tv({ base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent") });`;
    withTempFixture("FixtureCnTs.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      expect(result.changed).toBeGreaterThan(0);
    });
  });

  it("returns totalFound 0 for files without cn/tv/long class targets", () => {
    withTempFixture("FixtureEmpty.tsx", "export const only = 1;\n", (filePath) => {
      expect(
        service.processFile({ filePath, options: { write: false, withClassName: false } }),
      ).toEqual({ filePath, totalFound: 0, changed: 0 });
    });
  });

  it("dry-run returns totalFound 0 when cn partition is already idempotent", () => {
    const before = `import { cn } from "@codefast/tailwind-variants";
cn("flex gap-2", "text-sm");`;
    withTempFixture("FixturePartitionEq.tsx", before, (filePath) => {
      expect(
        service.processFile({ filePath, options: { write: false, withClassName: false } }),
      ).toEqual({ filePath, totalFound: 0, changed: 0 });
    });
  });

  it("counts cn() inside tv with zero args as found but unchanged", () => {
    const before = `import { cn, tv } from "@codefast/tailwind-variants";
export const broken = tv({ base: cn() });`;
    withTempFixture("FixtureZeroArg.tsx", before, (filePath) => {
      const dry = service.processFile({
        filePath,
        options: { write: false, withClassName: false },
      });
      expect(dry.filePath).toBe(filePath);
      expect(dry.totalFound).toBe(1);
      expect(dry.changed).toBe(0);
      const wet = service.processFile({ filePath, options: { write: true, withClassName: false } });
      expect(wet).toEqual({ filePath, totalFound: 1, changed: 0 });
    });
  });

  it("inserts cn import before first existing import", () => {
    const before = `import React from "react";
export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    withTempFixture("FixtureImportOrder.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      expect(result.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.indexOf("import { cn }")).toBeLessThan(after.indexOf("import React"));
    });
  });

  it("passes withClassName option through cn replacement", () => {
    const before = `import { cn } from "@codefast/tailwind-variants";
export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    withTempFixture("FixtureWithClassName.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: true },
      });
      expect(result.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after).toContain("className={cn(");
      expect(after).toContain("className");
    });
  });

  it("merges cn into existing named import when cnImport override matches", () => {
    const before = `import { tv } from "clsx";
export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    withTempFixture("FixtureMergeImport.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false, cnImport: "clsx" },
      });
      expect(result.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after).toContain('import { cn, tv } from "clsx"');
    });
  });

  it("groups compoundVariants class array slots", () => {
    const before = `import { tv } from "@codefast/tailwind-variants";
export const sheet = tv({
  compoundVariants: [{ className: ["flex gap-2 text-sm rounded-md border px-3 font-medium", "shadow-xs"] }],
});`;
    withTempFixture("FixtureCvClassArray.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      expect(result.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after).toContain("compoundVariants");
    });
  });

  it("groups compoundVariants mixed class array slot with cn(...) and plain strings", () => {
    const before = `import { cn, tv } from "@codefast/tailwind-variants";
export const sheet = tv({
  compoundVariants: [{ class: ["py-1", cn("flex gap-2 text-sm rounded-md border px-3 font-medium shadow-xs")] }],
});`;
    withTempFixture("FixtureCvClassCn.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: true, withClassName: false },
      });
      expect(result.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after).toContain("class:");
    });
  });

  it("dry-run returns workPlan with combined unwrap + grouping edits", () => {
    const long =
      "flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card font-medium shadow-xs";
    const before = `import { cn, tv } from "@codefast/tailwind-variants";
cn("${long}");
export const styles = tv({ base: cn("${long}") });`;
    withTempFixture("FixtureDryCombined.tsx", before, (filePath) => {
      const result = service.processFile({
        filePath,
        options: { write: false, withClassName: false },
      });
      expect(result.workPlan).toBeDefined();
      const output = captureStdout(() => {
        printGroupFilePreviewFromWork(arrangeLogger, result.workPlan!);
      });
      expect(output).toContain("[cn] / [tv] / [JSX className]");
    });
  });
});
