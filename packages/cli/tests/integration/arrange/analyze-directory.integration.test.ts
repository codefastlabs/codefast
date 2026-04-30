/**
 * Integration Test: covers AnalyzeDirectoryUseCase (via ArrangeModule + DI), with ArrangeAnalyze
 * presenter helpers for asserting human-readable output shape.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Container } from "@codefast/di";
import { ArrangeModule } from "#/lib/arrange/arrange.module";
import { AnalyzeDirectoryUseCaseToken } from "#/lib/arrange/contracts/tokens";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";

const container = Container.create();
container.load(ArrangeModule);
const analyzeDirectoryUseCase = container.resolve(AnalyzeDirectoryUseCaseToken);
void container.resolve(CliLoggerToken);

function analyzeReportOrThrow(rootPath: string): AnalyzeReport {
  const outcome = analyzeDirectoryUseCase.execute({ analyzeRootPath: rootPath });
  expect(outcome.ok).toBe(true);
  if (!outcome.ok) {
    throw new Error(outcome.error.message);
  }
  return outcome.value;
}

describe("analyzeDirectory", () => {
  it("collects long cn / tv / JSX literals and nested cn in tv", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-analyze-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    const source = `import { cn, tv } from "@codefast/tailwind-variants";

cn("${long}");
export const styles = tv({ base: "${long}" });
export function X() { return <div className={"${long}"} />; }
export const nested = tv({ base: cn("x", "${long}") });
`;
    try {
      fs.writeFileSync(path.join(dir, "Report.tsx"), source, "utf8");
      const report = analyzeReportOrThrow(dir);
      expect(report.files).toBe(1);
      expect(report.cnCallExpressions).toBeGreaterThanOrEqual(1);
      expect(report.tvCallExpressions).toBeGreaterThanOrEqual(1);
      expect(report.longCnStringLiterals.length).toBeGreaterThanOrEqual(1);
      expect(report.longTvStringLiterals.length).toBeGreaterThanOrEqual(1);
      expect(report.longJsxClassNameLiterals.length).toBeGreaterThanOrEqual(1);
      expect(report.cnInsideTvCalls.length).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports many long cn literals", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-analyze-many-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    try {
      let body = `import { cn } from "@codefast/tailwind-variants";\n`;
      for (let i = 0; i < 42; i++) {
        body += `cn("${long}");\n`;
      }
      fs.writeFileSync(path.join(dir, "Many.tsx"), body, "utf8");
      const report = analyzeReportOrThrow(dir);
      expect(report.longCnStringLiterals.length).toBeGreaterThan(40);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not count JSX className={identifier} as long literal", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-jsx-dyn-"));
    try {
      fs.writeFileSync(
        path.join(dir, "Dyn.tsx"),
        `export function F(cls: string) { return <div className={cls} />; }`,
        "utf8",
      );
      const report = analyzeReportOrThrow(dir);
      expect(report.longJsxClassNameLiterals.length).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("analyzes tv compoundVariants with quoted className key", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-tv-quoted-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    try {
      fs.writeFileSync(
        path.join(dir, "Quoted.tsx"),
        `import { tv } from "@codefast/tailwind-variants";
export const styles = tv({ compoundVariants: [{ "className": "${long}" }] });`,
        "utf8",
      );
      const report = analyzeReportOrThrow(dir);
      expect(report.longTvStringLiterals.length).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("analyzes tv array slots with nested cn", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-analyze-tv-array-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    try {
      fs.writeFileSync(
        path.join(dir, "TvArray.tsx"),
        `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({ base: [cn("${long}"), "py-0"] });`,
        "utf8",
      );
      const report = analyzeReportOrThrow(dir);
      expect(report.tvCallExpressions).toBeGreaterThanOrEqual(1);
      expect(report.cnInsideTvCalls.length).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts legacy tailwind-variants imports during analyze pass (backward compat)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-analyze-legacy-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    const source = `import { cn, tv } from "tailwind-variants";

cn("${long}");
export const styles = tv({ base: "${long}" });
`;
    try {
      fs.writeFileSync(path.join(dir, "Legacy.tsx"), source, "utf8");
      const report = analyzeReportOrThrow(dir);
      expect(report.cnCallExpressions).toBeGreaterThanOrEqual(1);
      expect(report.tvCallExpressions).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
