import { execFileSync } from "node:child_process";
import path from "node:path";

import type { RunsAuditResult } from "#audit/domain/types";
import { scanMarkdownLinks } from "#audit/links/domain/markdown-links";
import type { BenchRunEntry, BenchRunSuite } from "#audit/runs/domain/bench-runs";
import { auditBenchRuns, parsePinnedBaselineId } from "#audit/runs/domain/bench-runs";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";

/**
 * Checks every bench suite's committed `baselines/`/`runs/` split against the four structural rules.
 *
 * @remarks Reads `git ls-files` for the tracked-file universe, so it must run inside a git checkout.
 */
export function runRunsAudit(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
  },
): Result<RunsAuditResult, AppError> {
  try {
    const { rootDir, targetPath } = args;
    const suiteRelativePaths = discoverSuiteDirectories(fs, rootDir, targetPath);
    const suites = suiteRelativePaths.map((suiteRelativePath) => readSuite(fs, rootDir, suiteRelativePath));

    const trackedFiles = listTrackedFiles(rootDir);
    const trackedObservationsPaths = trackedFiles.filter((filePath) => basename(filePath) === "observations.jsonl");
    const trackedMarkdownPaths = trackedFiles.filter((filePath) => filePath.endsWith(".md"));
    const citedPaths = collectCitedPaths(fs, rootDir, trackedMarkdownPaths);

    const findings = auditBenchRuns({ suites, trackedObservationsPaths, citedPaths });

    return ok({ findings, findingCount: findings.length, scannedSuiteCount: suites.length });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function readSuite(fs: Filesystem, rootDir: string, suiteRelativePath: string): BenchRunSuite {
  const suiteAbsolutePath = toAbsolutePath(rootDir, suiteRelativePath);
  const baselines = readRoleEntries(fs, rootDir, suiteRelativePath, "baselines");
  const runs = readRoleEntries(fs, rootDir, suiteRelativePath, "runs");

  return {
    relativePath: suiteRelativePath,
    hasBaselinesDirectory: baselines.exists,
    baselineEntries: baselines.entries,
    runEntries: runs.entries,
    pinnedBaselineId: readPinnedBaselineId(fs, suiteAbsolutePath),
  };
}

/** Every directory directly under a suite's `baselines/` or `runs/` tree, with its own child names. */
function readRoleEntries(
  fs: Filesystem,
  rootDir: string,
  suiteRelativePath: string,
  roleName: "baselines" | "runs",
): { readonly exists: boolean; readonly entries: Array<BenchRunEntry> } {
  const roleRelativePath = `${suiteRelativePath}/${roleName}`;
  const roleAbsolutePath = toAbsolutePath(rootDir, roleRelativePath);

  if (!fs.existsSync(roleAbsolutePath) || !fs.statSync(roleAbsolutePath).isDirectory()) {
    return { exists: false, entries: [] };
  }

  const entries: Array<BenchRunEntry> = [];
  for (const id of fs.readdirSync(roleAbsolutePath).sort((left, right) => left.localeCompare(right))) {
    const entryAbsolutePath = path.join(roleAbsolutePath, id);
    if (!fs.statSync(entryAbsolutePath).isDirectory()) {
      continue;
    }
    const childNames = fs.readdirSync(entryAbsolutePath).sort((left, right) => left.localeCompare(right));
    entries.push({ id, relativePath: `${roleRelativePath}/${id}`, childNames });
  }

  return { exists: true, entries };
}

function readPinnedBaselineId(fs: Filesystem, suiteAbsolutePath: string): string | null {
  const manifestPath = path.join(suiteAbsolutePath, "package.json");
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { scripts?: Record<string, unknown> };
  const script = manifest.scripts?.["bench:baseline"];
  return parsePinnedBaselineId(typeof script === "string" ? script : undefined);
}

/** Every markdown link's target, resolved against its own document and made repo-relative. */
function collectCitedPaths(fs: Filesystem, rootDir: string, trackedMarkdownPaths: ReadonlyArray<string>): Set<string> {
  const cited = new Set<string>();

  for (const markdownRelativePath of trackedMarkdownPaths) {
    const markdownAbsolutePath = toAbsolutePath(rootDir, markdownRelativePath);
    if (!fs.existsSync(markdownAbsolutePath)) {
      continue;
    }
    const { references } = scanMarkdownLinks(fs.readFileSync(markdownAbsolutePath, "utf8"));
    for (const reference of references) {
      if (reference.targetPath === "") {
        continue;
      }
      const resolved = path.resolve(path.dirname(markdownAbsolutePath), reference.targetPath);
      cited.add(toPosixPath(path.relative(rootDir, resolved)));
    }
  }

  return cited;
}

function discoverSuiteDirectories(fs: Filesystem, rootDir: string, target: string): Array<string> {
  const suffix = "/package.json";
  const glob = `${toPosixPath(target).replace(/\/+$/, "")}${suffix}`;
  const relativeDirectories = new Set<string>();

  for (const matchedPath of fs.globSync(glob, { cwd: rootDir })) {
    const posixPath = toPosixPath(matchedPath);
    if (posixPath.endsWith(suffix)) {
      relativeDirectories.add(posixPath.slice(0, -suffix.length));
    }
  }

  return [...relativeDirectories].sort((left, right) => left.localeCompare(right));
}

/** Every path `git ls-files` reports for the repository rooted at `rootDir`, tracked files only. */
function listTrackedFiles(rootDir: string): Array<string> {
  return execFileSync("git", ["ls-files"], { cwd: rootDir, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function basename(posixPath: string): string {
  return posixPath.slice(posixPath.lastIndexOf("/") + 1);
}

function toAbsolutePath(rootDir: string, relativePosixPath: string): string {
  return path.resolve(rootDir, relativePosixPath.split("/").join(path.sep));
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
