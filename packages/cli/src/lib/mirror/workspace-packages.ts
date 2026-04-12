import { globSync } from "node:fs";
import path from "node:path";
import picomatch from "picomatch";
import { parse as parseYaml } from "yaml";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { normalizePath } from "#lib/mirror/engine";
import { mirrorGlobWarning } from "#lib/mirror/reporter";
import type { FindWorkspacePackagesResult, WorkspaceMultiDiscoverySource } from "#lib/mirror/types";

const PNPM_WORKSPACE = "pnpm-workspace.yaml";

/** Default when the workspace file is missing or has no `packages` key. */
const DEFAULT_INCLUDE = ["packages/*"];

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function isGlobPermissionError(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("code" in err)) return false;
  const code = (err as NodeJS.ErrnoException).code;
  return code === "EACCES" || code === "EPERM";
}

/** Turn a pnpm `packages` glob into a `globSync` pattern that finds `package.json` files. */
export function workspacePatternToPackageJsonGlob(pattern: string): string {
  const p = toPosix(pattern.trim()).replace(/\/+$/, "");
  if (!p) return "**/package.json";
  return `${p}/package.json`;
}

export function splitWorkspacePackageEntries(raw: unknown): {
  include: string[];
  exclude: string[];
} {
  const include: string[] = [];
  const exclude: string[] = [];
  if (!Array.isArray(raw)) return { include, exclude };
  for (const e of raw) {
    if (typeof e !== "string") continue;
    const s = e.trim();
    if (!s) continue;
    if (s.startsWith("!")) exclude.push(s.slice(1).trim());
    else include.push(s);
  }
  return { include, exclude };
}

/**
 * Reads `packages` from a parsed pnpm workspace document.
 * @throws If the document is invalid or `packages` is present but not an array.
 */
export function parsePnpmWorkspaceDocument(doc: unknown): {
  include: string[];
  exclude: string[];
  hasPackagesKey: boolean;
  /** True only when `packages` exists and the YAML array is literally `[]`. */
  isEmptyPackagesArray: boolean;
} {
  if (doc === null || doc === undefined) {
    throw new Error(`${PNPM_WORKSPACE} root document must be an object (got empty or null)`);
  }
  if (typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`${PNPM_WORKSPACE} root must be a mapping, not an array or scalar`);
  }
  const o = doc as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(o, "packages")) {
    return { include: [], exclude: [], hasPackagesKey: false, isEmptyPackagesArray: false };
  }
  const pkgs = o.packages;
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
  const fp = path.join(rootDir, PNPM_WORKSPACE);
  if (!fs.existsSync(fp)) {
    return { exists: false };
  }
  let raw: string;
  try {
    raw = await fs.readFile(fp, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to read ${PNPM_WORKSPACE}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let doc: unknown;
  try {
    doc = parseYaml(raw) as unknown;
  } catch (error) {
    throw new Error(
      `Failed to parse ${PNPM_WORKSPACE}: ${error instanceof Error ? error.message : String(error)}`,
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
  logger: CliLogger,
): Promise<FindWorkspacePackagesResult> {
  const ws = await readWorkspaceYaml(rootDir, fs);

  let include: string[];
  let exclude: string[];
  let multiSource: WorkspaceMultiDiscoverySource;

  if (!ws.exists) {
    include = [...DEFAULT_INCLUDE];
    exclude = [];
    multiSource = "default-patterns";
  } else {
    const parsed = parsePnpmWorkspaceDocument(ws.doc);
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
    } catch (error) {
      if (isGlobPermissionError(error)) {
        mirrorGlobWarning(
          logger,
          `Skipping workspace glob "${pattern}" (${error instanceof Error ? error.message : String(error)})`,
        );
        continue;
      }
      throw new Error(
        `Invalid workspace glob "${pattern}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    for (const m of matches) {
      const posix = toPosix(m);
      if (!posix.endsWith("/package.json")) continue;
      const rel = posix.slice(0, -"/package.json".length);
      if (!rel) continue;
      found.add(normalizePath(rel));
    }
  }

  const excludeMatchers = exclude.map((pat) => picomatch(pat, { dot: true }));

  const relPaths = [...found].filter((rel) => !excludeMatchers.some((isMatch) => isMatch(rel)));
  relPaths.sort((a, b) => a.localeCompare(b));
  return { relPaths, multiSource };
}
