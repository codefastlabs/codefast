import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ArrangeError,
  ArrangeErrorCode,
  createNodeCliFs,
  createNodeCliLogger,
  runOnTarget,
} from "#lib/arrange";

const arrangeFs = createNodeCliFs();
const arrangeLogger = createNodeCliLogger();

function captureStdout(fn: () => void): string {
  const chunks: string[] = [];
  const spy = jest
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk: string | Uint8Array) => {
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

describe("runOnTarget", () => {
  it("prints dry-run totals for directory targets", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-dry-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    try {
      fs.writeFileSync(
        path.join(dir, "Page.tsx"),
        `import { cn } from "@codefast/tailwind-variants"; export function P(){ cn("${long}"); return null; }`,
        "utf8",
      );
      const out = captureStdout(() =>
        runOnTarget(dir, { write: false, withClassName: false }, arrangeFs, arrangeLogger),
      );
      expect(out).toContain("Total:");
      expect(out).toContain("to review");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws ArrangeError for missing target path", () => {
    let caught: unknown;
    try {
      runOnTarget(
        path.join(os.tmpdir(), "no-such-arrange-target"),
        { write: false, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
    } catch (caughtError: unknown) {
      caught = caughtError;
    }
    expect(caught).toBeInstanceOf(ArrangeError);
    expect((caught as ArrangeError).code).toBe(ArrangeErrorCode.TARGET_NOT_FOUND);
  });

  it("prints apply summary in write mode", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-apply-"));
    const before = `import { cn } from "@codefast/tailwind-variants";
export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    try {
      fs.writeFileSync(path.join(dir, "Apply.tsx"), before, "utf8");
      const out = captureStdout(() =>
        runOnTarget(dir, { write: true, withClassName: false }, arrangeFs, arrangeLogger),
      );
      expect(out).toContain("Applied:");
      expect(out).toContain("Note:");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts legacy tailwind-variants imports when running directory dry-run (backward compat)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-dry-legacy-"));
    const long =
      "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
    try {
      fs.writeFileSync(
        path.join(dir, "Page.tsx"),
        `import { cn } from "tailwind-variants"; export function P(){ cn("${long}"); return null; }`,
        "utf8",
      );
      const out = captureStdout(() =>
        runOnTarget(dir, { write: false, withClassName: false }, arrangeFs, arrangeLogger),
      );
      expect(out).toContain("Total:");
      expect(out).toContain("to review");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
