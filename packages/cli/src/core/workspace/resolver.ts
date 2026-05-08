import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import picomatch from "picomatch";
import { parse as parseYaml } from "yaml";
import type { FilesystemPort } from "#/core/filesystem/port";
import { messageFrom } from "#/core/errors";
import { logger } from "#/core/logger";

/**
 * Resolve the monorepo root (directory containing `pnpm-workspace.yaml`).
 *
 * @since 0.3.16-canary.0
 */
export function findRepoRoot(fromDirectory: string, fs: FilesystemPort): string {
  const candidates = [path.dirname(fileURLToPath(import.meta.url)), fromDirectory];

  for (const start of candidates) {
    let dir = path.resolve(start);
    for (;;) {
      if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }

  throw new Error(
    `Could not locate monorepo root (missing pnpm-workspace.yaml). Searched from: ${candidates.join(", ")}`,
  );
}

/**
 * @since 0.3.16-canary.0
 */
export type WorkspacePackageLayoutSource =
  | "pnpm-workspace-yaml"
  | "default-patterns"
  | "declared-empty";

/**
 * @since 0.3.16-canary.0
 */
export type WorkspacePackageLayoutOutcome = {
  readonly packageDirectoryPathsAbsolute: Array<string>;
  readonly layoutSource: WorkspacePackageLayoutSource;
  readonly hasPnpmWorkspaceYamlFile: boolean;
};

const workspaceYamlFileName = "pnpm-workspace.yaml";
const defaultIncludePatterns = ["packages/*"];
const packageJsonFileName = "package.json";

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function isGlobPermissionError(caughtError: unknown): boolean {
  if (typeof caughtError !== "object" || caughtError === null || !("code" in caughtError)) {
    return false;
  }
  const code = (caughtError as NodeJS.ErrnoException).code;
  return code === "EACCES" || code === "EPERM";
}

function workspacePatternToPackageJsonGlob(pattern: string): string {
  const normalizedPattern = toPosix(pattern.trim()).replace(/\/+$/, "");
  if (!normalizedPattern) {
    return `**/${packageJsonFileName}`;
  }
  return `${normalizedPattern}/${packageJsonFileName}`;
}

function splitPnpmWorkspacePackagesArray(raw: unknown): {
  include: Array<string>;
  exclude: Array<string>;
} {
  const include: Array<string> = [];
  const exclude: Array<string> = [];
  if (!Array.isArray(raw)) {
    return { include, exclude };
  }
  for (const entry of raw) {
    if (typeof entry !== "string") {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("!")) {
      exclude.push(trimmed.slice(1).trim());
    } else {
      include.push(trimmed);
    }
  }
  return { include, exclude };
}

function parsePnpmWorkspaceDocument(doc: unknown): {
  include: Array<string>;
  exclude: Array<string>;
  hasPackagesKey: boolean;
  isEmptyPackagesArray: boolean;
} {
  const wf = workspaceYamlFileName;
  if (doc === null || doc === undefined) {
    throw new Error(`${wf} root document must be an object (got empty or null)`);
  }
  if (typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`${wf} root must be a mapping, not an array or scalar`);
  }
  const parsedDoc = doc as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(parsedDoc, "packages")) {
    return { include: [], exclude: [], hasPackagesKey: false, isEmptyPackagesArray: false };
  }
  const pkgs = parsedDoc.packages;
  if (!Array.isArray(pkgs)) {
    throw new Error(`${wf} field "packages" must be an array`);
  }
  if (pkgs.length === 0) {
    return { include: [], exclude: [], hasPackagesKey: true, isEmptyPackagesArray: true };
  }
  return {
    ...splitPnpmWorkspacePackagesArray(pkgs),
    hasPackagesKey: true,
    isEmptyPackagesArray: false,
  };
}

async function readWorkspaceYaml(
  rootDir: string,
  fs: FilesystemPort,
): Promise<{ exists: false } | { exists: true; doc: unknown }> {
  const wf = workspaceYamlFileName;
  const workspaceYamlPath = path.join(rootDir, wf);
  if (!fs.existsSync(workspaceYamlPath)) {
    return { exists: false };
  }
  let raw: string;
  try {
    raw = await fs.readFile(workspaceYamlPath, "utf8");
  } catch (caughtReadError: unknown) {
    throw new Error(`Failed to read ${wf}: ${messageFrom(caughtReadError)}`);
  }
  let doc: unknown;
  try {
    doc = parseYaml(raw) as unknown;
  } catch (caughtYamlParseError: unknown) {
    throw new Error(`Failed to parse ${wf}: ${messageFrom(caughtYamlParseError)}`);
  }
  if (doc === null || doc === undefined) {
    throw new Error(`${wf} must define a mapping at the document root`);
  }
  return { exists: true, doc };
}

/**
 * @since 0.3.16-canary.0
 */
export async function listWorkspacePackageDirectories(
  rootDirectoryPathAbsolute: string,
  fs: FilesystemPort,
  suppressGlobPermissionDiagnostics?: boolean,
): Promise<WorkspacePackageLayoutOutcome> {
  const workspaceYaml = await readWorkspaceYaml(rootDirectoryPathAbsolute, fs);
  const defInc = defaultIncludePatterns;

  let include: Array<string>;
  let exclude: Array<string>;
  let layoutSource: WorkspacePackageLayoutSource;
  const hasPnpmWorkspaceYamlFile = workspaceYaml.exists;

  if (!workspaceYaml.exists) {
    include = [...defInc];
    exclude = [];
    layoutSource = "default-patterns";
  } else {
    const parsed = parsePnpmWorkspaceDocument(workspaceYaml.doc);
    if (!parsed.hasPackagesKey) {
      include = [...defInc];
      exclude = [];
      layoutSource = "default-patterns";
    } else if (parsed.isEmptyPackagesArray) {
      return {
        packageDirectoryPathsAbsolute: [],
        layoutSource: "declared-empty",
        hasPnpmWorkspaceYamlFile: true,
      };
    } else {
      include = parsed.include;
      exclude = parsed.exclude;
      layoutSource = "pnpm-workspace-yaml";
    }
  }

  const foundRelativePosixPackageRoots = new Set<string>();
  const globOpts = {
    cwd: rootDirectoryPathAbsolute,
    posix: true as const,
    ...(path.sep === "\\" ? { windowsPathsNoEscape: true as const } : {}),
  };

  for (const pattern of include) {
    const globPat = workspacePatternToPackageJsonGlob(pattern);
    let matches: Array<string>;
    try {
      matches = globSync(globPat, globOpts);
    } catch (caughtGlobError: unknown) {
      if (isGlobPermissionError(caughtGlobError)) {
        if (!suppressGlobPermissionDiagnostics) {
          logger.out(`⚠ Skipping workspace glob "${pattern}" (${messageFrom(caughtGlobError)})`);
        }
        continue;
      }
      throw new Error(`Invalid workspace glob "${pattern}": ${messageFrom(caughtGlobError)}`);
    }
    for (const matchedPath of matches) {
      const posix = toPosix(matchedPath);
      const suffix = `/${packageJsonFileName}`;
      if (!posix.endsWith(suffix)) {
        continue;
      }
      const rel = posix.slice(0, -suffix.length);
      if (!rel) {
        continue;
      }
      foundRelativePosixPackageRoots.add(rel);
    }
  }

  const excludeMatchers = exclude.map((pat) => picomatch(pat, { dot: true }));

  const filteredRelative = [...foundRelativePosixPackageRoots].filter(
    (rel) => !excludeMatchers.some((isMatch) => isMatch(rel)),
  );
  filteredRelative.sort((a, b) => a.localeCompare(b));

  const packageDirectoryPathsAbsolute = filteredRelative.map((rel) =>
    path.resolve(rootDirectoryPathAbsolute, rel.split("/").join(path.sep)),
  );

  return {
    packageDirectoryPathsAbsolute,
    layoutSource,
    hasPnpmWorkspaceYamlFile,
  };
}
