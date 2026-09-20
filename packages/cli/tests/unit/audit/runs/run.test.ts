import { execFileSync } from "node:child_process";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { runRunsAudit } from "#audit/runs/run";
import type { CliFileEncoding, DirectoryEntry, Filesystem } from "#core/filesystem/filesystem";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

const rootDir = path.join(path.sep, "repo");

function mockTrackedFiles(relativePosixPaths: ReadonlyArray<string>): void {
  vi.mocked(execFileSync).mockReturnValue(`${relativePosixPaths.join("\n")}\n`);
}

describe("runRunsAudit", () => {
  beforeEach(() => {
    vi.mocked(execFileSync).mockReset();
  });

  it("reports nothing when a suite's baselines, runs, and tracked files all line up", () => {
    const fs = createRunsTestFilesystem({
      [rel("benchmarks/di/package.json")]:
        '{"scripts":{"bench:baseline":"BENCH_BASELINE=baselines/2026-09-14T23-41-04-932Z node run.ts"}}',
      [rel("benchmarks/di/baselines/2026-09-14T23-41-04-932Z/observations.jsonl")]: "{}",
      [rel("benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl")]: "{}",
      [rel("docs/notes.md")]: "[run](../benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl)",
    });
    mockTrackedFiles([
      "benchmarks/di/package.json",
      "benchmarks/di/baselines/2026-09-14T23-41-04-932Z/observations.jsonl",
      "benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl",
      "docs/notes.md",
    ]);

    const outcome = runRunsAudit(fs, { rootDir, targetPath: "benchmarks/*" });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toMatchObject({ findingCount: 0, scannedSuiteCount: 1, findings: [] });
  });

  it("reports an extra baseline directory and an uncited runs directory", () => {
    const fs = createRunsTestFilesystem({
      [rel("benchmarks/di/package.json")]:
        '{"scripts":{"bench:baseline":"BENCH_BASELINE=baselines/2026-09-14T23-41-04-932Z node run.ts"}}',
      [rel("benchmarks/di/baselines/2026-09-14T23-41-04-932Z/observations.jsonl")]: "{}",
      [rel("benchmarks/di/baselines/2026-09-20T05-28-49-997Z/observations.jsonl")]: "{}",
      [rel("benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl")]: "{}",
      [rel("docs/notes.md")]: "no links here",
    });
    mockTrackedFiles([
      "benchmarks/di/package.json",
      "benchmarks/di/baselines/2026-09-14T23-41-04-932Z/observations.jsonl",
      "benchmarks/di/baselines/2026-09-20T05-28-49-997Z/observations.jsonl",
      "benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl",
      "docs/notes.md",
    ]);

    const outcome = runRunsAudit(fs, { rootDir, targetPath: "benchmarks/*" });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.findingCount).toBe(2);
    expect(outcome.value.findings.map((finding) => finding.relativePath)).toEqual([
      "benchmarks/di/baselines/2026-09-20T05-28-49-997Z",
      "benchmarks/di/runs/2026-09-20T02-07-56-518Z",
    ]);
  });
});

function rel(relativePosixPath: string): string {
  return path.join(rootDir, ...relativePosixPath.split("/"));
}

function createRunsTestFilesystem(files: Record<string, string>): Filesystem {
  const normalized = new Map(Object.entries(files).map(([filePath, content]) => [path.normalize(filePath), content]));

  return {
    existsSync: (filePath) => {
      const normalizedPath = path.normalize(filePath);
      if (normalized.has(normalizedPath)) {
        return true;
      }
      const prefix = normalizedPath.endsWith(path.sep) ? normalizedPath : normalizedPath + path.sep;
      return [...normalized.keys()].some((candidate) => candidate.startsWith(prefix));
    },
    canonicalPathSync: (inputPath) => path.normalize(inputPath),
    globSync: (pattern, options) => {
      const patternSegments = pattern.split("/");
      const cwd = path.normalize(options.cwd);
      const prefix = cwd.endsWith(path.sep) ? cwd : cwd + path.sep;
      const matches: Array<string> = [];
      for (const filePath of normalized.keys()) {
        if (!filePath.startsWith(prefix)) {
          continue;
        }
        const segments = filePath.slice(prefix.length).split(path.sep);
        if (segments.length !== patternSegments.length) {
          continue;
        }
        const isMatch = segments.every(
          (segment, index) => patternSegments[index] === "*" || patternSegments[index] === segment,
        );
        if (isMatch) {
          matches.push(segments.join("/"));
        }
      }
      return matches;
    },
    statSync: (filePath) => {
      const normalizedPath = path.normalize(filePath);
      if (normalized.has(normalizedPath)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      const prefix = normalizedPath.endsWith(path.sep) ? normalizedPath : normalizedPath + path.sep;
      const hasChild = [...normalized.keys()].some((candidate) => candidate.startsWith(prefix));
      if (hasChild) {
        return { isDirectory: () => true, isFile: () => false };
      }
      throw new Error(`missing path: ${filePath}`);
    },
    readFileSync: (filePath, encoding) => {
      if (encoding !== "utf8") {
        throw new Error("unexpected encoding");
      }
      const content = normalized.get(path.normalize(filePath));
      if (content === undefined) {
        throw new Error(`missing file: ${filePath}`);
      }
      return content;
    },
    writeFileSync: () => {
      throw new Error("unexpected write");
    },
    readdirSync: (directoryPath) => {
      const normalizedDirectory = path.normalize(directoryPath);
      const prefix = normalizedDirectory.endsWith(path.sep) ? normalizedDirectory : normalizedDirectory + path.sep;
      const names = new Set<string>();
      for (const filePath of normalized.keys()) {
        if (!filePath.startsWith(prefix)) {
          continue;
        }
        const name = filePath.slice(prefix.length).split(path.sep)[0];
        if (name) {
          names.add(name);
        }
      }
      return [...names];
    },
    readFile: async () => "",
    writeFile: async (_filePath: string, _data: string, _encoding: CliFileEncoding) => {},
    readdir: async (): Promise<Array<string> | Array<DirectoryEntry>> => [],
    rename: async () => {},
    unlink: async () => {},
  };
}
