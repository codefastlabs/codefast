import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runOnTarget } from "#lib/arrange/application/use-cases/run-arrange-sync.use-case";
import { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io.adapter";
import { domainSourceParserAdapter } from "#lib/arrange/infra/domain-source-parser.adapter";
import { FileWalkerAdapter } from "#lib/arrange/infra/file-walker.adapter";

const arrangeFs = createNodeCliFs();
const arrangeLogger = createNodeCliLogger();
const fileWalker = new FileWalkerAdapter();

const arrangeDeps = {
  fs: arrangeFs,
  logger: arrangeLogger,
  fileWalker,
  domainSourceParser: domainSourceParserAdapter,
};

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
      const out = captureStdout(() => {
        const outcome = runOnTarget(
          { targetPath: dir, write: false, withClassName: false },
          arrangeDeps,
        );
        expect(outcome.ok).toBe(true);
      });
      expect(out).toContain("Total:");
      expect(out).toContain("to review");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns NOT_FOUND for missing target path", () => {
    const outcome = runOnTarget(
      {
        targetPath: path.join(os.tmpdir(), "no-such-arrange-target"),
        write: false,
        withClassName: false,
      },
      arrangeDeps,
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected failure");
    }
    expect(outcome.error.code).toBe("NOT_FOUND");
  });

  it("prints apply summary in write mode", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-apply-"));
    const before = `import { cn } from "@codefast/tailwind-variants";
export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    try {
      fs.writeFileSync(path.join(dir, "Apply.tsx"), before, "utf8");
      const out = captureStdout(() => {
        const outcome = runOnTarget(
          { targetPath: dir, write: true, withClassName: false },
          arrangeDeps,
        );
        expect(outcome.ok).toBe(true);
      });
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
      const out = captureStdout(() => {
        const outcome = runOnTarget(
          { targetPath: dir, write: false, withClassName: false },
          arrangeDeps,
        );
        expect(outcome.ok).toBe(true);
      });
      expect(out).toContain("Total:");
      expect(out).toContain("to review");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
