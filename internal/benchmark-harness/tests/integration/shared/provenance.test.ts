import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createHarnessSourceComparer, HARNESS_MEASURING_PATHS, readHarnessProvenance } from "#shared/provenance";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
const CHILD_FILE = "internal/benchmark-harness/src/child/loop.ts";
const REPORT_FILE = "internal/benchmark-harness/src/report/table.ts";
const UNKNOWN_COMMIT = "0000000000000000000000000000000000000001";

let repository: string;
let outside: string;

// A throwaway repository with its own identity, so the user's global config cannot sign or hook.
function git(...args: ReadonlyArray<string>): string {
  return execFileSync(
    "git",
    ["-C", repository, "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "bench",
        GIT_AUTHOR_EMAIL: "bench@example.invalid",
        GIT_COMMITTER_NAME: "bench",
        GIT_COMMITTER_EMAIL: "bench@example.invalid",
      },
    },
  ).trim();
}

function write(relativePath: string, content: string): void {
  const absolutePath = join(repository, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

function commit(message: string): string {
  git("add", "-A");
  git("commit", "-q", "-m", message);
  return git("rev-parse", "HEAD");
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "bench-provenance-repo-"));
  outside = mkdtempSync(join(tmpdir(), "bench-provenance-outside-"));
  git("init", "-q");
});

afterEach(() => {
  rmSync(repository, { force: true, recursive: true });
  rmSync(outside, { force: true, recursive: true });
});

describe("HARNESS_MEASURING_PATHS", () => {
  // The constant names directories by hand; a move would otherwise leave it watching nothing.
  it("names directories that exist in this repository", () => {
    const missing = HARNESS_MEASURING_PATHS.filter((path) => !existsSync(join(REPO_ROOT, path)));
    expect(missing).toEqual([]);
  });
});

describe("readHarnessProvenance", () => {
  it("reads the head commit and a clean tree", () => {
    write(CHILD_FILE, "export const loop = 1;\n");
    const head = commit("child");
    expect(readHarnessProvenance(repository)).toEqual({ harnessCommit: head, harnessDirty: false });
  });

  it("flags an uncommitted or untracked change under a measuring path, and ignores one outside", () => {
    write(CHILD_FILE, "export const loop = 1;\n");
    commit("child");
    write(CHILD_FILE, "export const loop = 2;\n");
    expect(readHarnessProvenance(repository)?.harnessDirty).toBe(true);
    commit("child again");
    write(REPORT_FILE, "export const table = 1;\n");
    expect(readHarnessProvenance(repository)?.harnessDirty).toBe(false);
    write("internal/benchmark-harness/src/shared/new.ts", "export const fresh = 1;\n");
    expect(readHarnessProvenance(repository)?.harnessDirty).toBe(true);
  });

  it("reads from a subdirectory of the checkout, as a suite package root is", () => {
    write(CHILD_FILE, "export const loop = 1;\n");
    const head = commit("child");
    write("benchmarks/suite/package.json", "{}\n");
    expect(readHarnessProvenance(join(repository, "benchmarks", "suite"))?.harnessCommit).toBe(head);
  });

  it("reads nothing outside a git checkout", () => {
    expect(readHarnessProvenance(outside)).toBeUndefined();
  });
});

describe("createHarnessSourceComparer", () => {
  it("answers same for equal commits without a checkout", () => {
    expect(createHarnessSourceComparer(outside)(UNKNOWN_COMMIT, UNKNOWN_COMMIT)).toBe("same");
  });

  it("answers unknown for different commits outside a checkout, or for a commit the checkout lacks", () => {
    expect(createHarnessSourceComparer(outside)(UNKNOWN_COMMIT, "0000000000000000000000000000000000000002")).toBe(
      "unknown",
    );
    write(CHILD_FILE, "export const loop = 1;\n");
    const head = commit("child");
    expect(createHarnessSourceComparer(repository)(UNKNOWN_COMMIT, head)).toBe("unknown");
  });

  it("reads a change under a measuring path as changed, and one outside as same", () => {
    write(CHILD_FILE, "export const loop = 1;\n");
    const first = commit("child");
    write(REPORT_FILE, "export const table = 1;\n");
    const second = commit("report");
    write(CHILD_FILE, "export const loop = 2;\n");
    const third = commit("child again");
    const compare = createHarnessSourceComparer(repository);
    expect(compare(first, second)).toBe("same");
    expect(compare(second, third)).toBe("changed");
    expect(compare(first, third)).toBe("changed");
  });
});
