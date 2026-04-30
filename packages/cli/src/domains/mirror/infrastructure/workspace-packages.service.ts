import { globSync } from "node:fs";
import path from "node:path";
import picomatch from "picomatch";
import { parse as parseYaml } from "yaml";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";
import type {
  FindWorkspacePackagesResult,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";

const PNPM_WORKSPACE = "pnpm-workspace.yaml";

/**
 * Default when the workspace file is missing or has no `packages` key.
 */
const DEFAULT_INCLUDE = ["packages/*"];

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

/**
 * Turn a pnpm `packages` glob into a `globSync` pattern that finds `package.json` files.
 */
function workspacePatternToPackageJsonGlob(pattern: string): string {
  const normalizedPattern = toPosix(pattern.trim()).replace(/\/+$/, "");
  if (!normalizedPattern) {
    return "**/package.json";
  }
  return `${normalizedPattern}/package.json`;
}

function splitWorkspacePackageEntries(raw: unknown): {
  include: string[];
  exclude: string[];
} {
  const include: string[] = [];
  const exclude: string[] = [];
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

/**
 * Reads `packages` from a parsed pnpm workspace document.
 * @throws If the document is invalid or `packages` is present but not an array.
 */
function parsePnpmWorkspaceDocument(doc: unknown): {
  include: string[];
  exclude: string[];
  hasPackagesKey: boolean;
  /**
   * True only when `packages` exists and the YAML array is literally `[]`.
   */
  isEmptyPackagesArray: boolean;
} {
  if (doc === null || doc === undefined) {
    throw new Error(`${PNPM_WORKSPACE} root document must be an object (got empty or null)`);
  }
  if (typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`${PNPM_WORKSPACE} root must be a mapping, not an array or scalar`);
  }
  const parsedDoc = doc as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(parsedDoc, "packages")) {
    return { include: [], exclude: [], hasPackagesKey: false, isEmptyPackagesArray: false };
  }
  const pkgs = parsedDoc.packages;
  if (!Array.isArray(pkgs)) {
    throw new Error(`${PNPM_WORKSPACE} field "packages" must be an array`);
  }
  if (pkgs.length === 0) {
    return { include: [], exclude: [], hasPackagesKey: true, isEmptyPackagesArray: true };
  }
  return {
    ...splitWorkspacePackageEntries(pkgs),
    hasPackagesKey: true,
    isEmptyPackagesArray: false,
  };
}

type ReadWorkspaceYamlMissing = { exists: false };
type ReadWorkspaceYamlOk = { exists: true; doc: unknown };
type ReadWorkspaceYamlResult = ReadWorkspaceYamlMissing | ReadWorkspaceYamlOk;

async function readWorkspaceYaml(rootDir: string, fs: CliFs): Promise<ReadWorkspaceYamlResult> {
  const workspaceYamlPath = path.join(rootDir, PNPM_WORKSPACE);
  if (!fs.existsSync(workspaceYamlPath)) {
    return { exists: false };
  }
  let raw: string;
  try {
    raw = await fs.readFile(workspaceYamlPath, "utf8");
  } catch (caughtReadError: unknown) {
    throw new Error(
      `Failed to read ${PNPM_WORKSPACE}: ${messageFromCaughtUnknown(caughtReadError)}`,
    );
  }
  let doc: unknown;
  try {
    doc = parseYaml(raw) as unknown;
  } catch (caughtYamlParseError: unknown) {
    throw new Error(
      `Failed to parse ${PNPM_WORKSPACE}: ${messageFromCaughtUnknown(caughtYamlParseError)}`,
    );
  }
  if (doc === null || doc === undefined) {
    throw new Error(`${PNPM_WORKSPACE} must define a mapping at the document root`);
  }
  return { exists: true, doc };
}

/**
 * Workspace package directories relative to `rootDir` (POSIX slashes), sorted.
 * Reads `pnpm-workspace.yaml` when present; otherwise uses `packages/*`.
 * Only paths with a `package.json` are returned (same practical rule as pnpm).
 */
export async function findWorkspacePackageRelPaths(
  rootDir: string,
  fs: CliFs,
  onGlobWarning: (message: string) => void,
): Promise<FindWorkspacePackagesResult> {
  const workspaceYaml = await readWorkspaceYaml(rootDir, fs);

  let include: string[];
  let exclude: string[];
  let multiSource: WorkspaceMultiDiscoverySource;

  if (!workspaceYaml.exists) {
    include = [...DEFAULT_INCLUDE];
    exclude = [];
    multiSource = "default-patterns";
  } else {
    const parsed = parsePnpmWorkspaceDocument(workspaceYaml.doc);
    if (!parsed.hasPackagesKey) {
      include = [...DEFAULT_INCLUDE];
      exclude = [];
      multiSource = "default-patterns";
    } else if (parsed.isEmptyPackagesArray) {
      return { relPaths: [], multiSource: "declared-empty" };
    } else {
      include = parsed.include;
      exclude = parsed.exclude;
      multiSource = "pnpm-workspace-yaml";
    }
  }

  const found = new Set<string>();
  const globOpts = {
    cwd: rootDir,
    posix: true as const,
    ...(path.sep === "\\" ? { windowsPathsNoEscape: true as const } : {}),
  };

  for (const pattern of include) {
    const globPat = workspacePatternToPackageJsonGlob(pattern);
    let matches: string[];
    try {
      matches = globSync(globPat, globOpts);
    } catch (caughtGlobError: unknown) {
      if (isGlobPermissionError(caughtGlobError)) {
        onGlobWarning(
          `Skipping workspace glob "${pattern}" (${messageFromCaughtUnknown(caughtGlobError)})`,
        );
        continue;
      }
      throw new Error(
        `Invalid workspace glob "${pattern}": ${messageFromCaughtUnknown(caughtGlobError)}`,
      );
    }
    for (const matchedPath of matches) {
      const posix = toPosix(matchedPath);
      if (!posix.endsWith("/package.json")) {
        continue;
      }
      const rel = posix.slice(0, -"/package.json".length);
      if (!rel) {
        continue;
      }
      found.add(normalizePath(rel));
    }
  }

  const excludeMatchers = exclude.map((pat) => picomatch(pat, { dot: true }));

  const relPaths = [...found].filter((rel) => !excludeMatchers.some((isMatch) => isMatch(rel)));
  relPaths.sort((a, b) => a.localeCompare(b));
  return { relPaths, multiSource };
}
