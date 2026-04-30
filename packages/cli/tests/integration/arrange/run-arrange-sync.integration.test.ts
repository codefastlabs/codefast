/**
 * Integration Test: covers RunArrangeSyncUseCase end-to-end via ArrangeModule (imports infrastructure).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Container } from "@codefast/di";
import { ArrangeModule } from "#/lib/arrange/arrange.module";
import { RunArrangeSyncUseCaseToken } from "#/lib/arrange/contracts/tokens";

describe("RunArrangeSyncUseCase integration", () => {
  const container = Container.create();
  container.load(ArrangeModule);
  const useCase = container.resolve(RunArrangeSyncUseCaseToken);

  it("returns found sites for directory targets (dry-run)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-dry-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    try {
      fs.writeFileSync(
        path.join(dir, "Page.tsx"),
        `import { cn } from "@codefast/tailwind-variants"; export function P(){ cn("${long}"); return null; }`,
        "utf8",
      );
      const outcome = await useCase.execute({
        rootDir: dir,
        targetPath: dir,
        write: false,
        withClassName: false,
      });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        throw new Error("expected ok");
      }
      expect(outcome.value.totalFound).toBeGreaterThan(0);
      expect(outcome.value.totalChanged).toBe(0);
      expect(Array.isArray(outcome.value.previewPlans)).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns changed count and modified files in write mode", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-apply-"));
    const before = `import { cn } from "@codefast/tailwind-variants";
export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    try {
      fs.writeFileSync(path.join(dir, "Apply.tsx"), before, "utf8");
      const outcome = await useCase.execute({
        rootDir: dir,
        targetPath: dir,
        write: true,
        withClassName: false,
      });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        throw new Error("expected ok");
      }
      expect(outcome.value.totalChanged).toBeGreaterThan(0);
      expect(outcome.value.modifiedFiles.length).toBeGreaterThan(0);
      expect(outcome.value.hookError).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts legacy tailwind-variants imports in directory dry-run", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-dry-legacy-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    try {
      fs.writeFileSync(
        path.join(dir, "Page.tsx"),
        `import { cn } from "tailwind-variants"; export function P(){ cn("${long}"); return null; }`,
        "utf8",
      );
      const outcome = await useCase.execute({
        rootDir: dir,
        targetPath: dir,
        write: false,
        withClassName: false,
      });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        throw new Error("expected ok");
      }
      expect(outcome.value.totalFound).toBeGreaterThan(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
