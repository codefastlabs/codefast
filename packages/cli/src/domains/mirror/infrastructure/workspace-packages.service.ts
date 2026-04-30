import { globSync } from "node:fs";
import path from "node:path";
import picomatch from "picomatch";
import { parse as parseYaml } from "yaml";
import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import type { WorkspacePackageDiscoveryPort } from "#/domains/mirror/application/ports/workspace-package-discovery.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";
import type {
  FindWorkspacePackagesResult,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";

@injectable([inject(CliFsToken)])
export class WorkspacePackageDiscovery implements WorkspacePackageDiscoveryPort {
  private static readonly workspaceFile = "pnpm-workspace.yaml";
  private static readonly defaultInclude = ["packages/*"];

  constructor(private readonly fs: CliFs) {}

  findWorkspacePackageRelPaths(
    rootDir: string,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult> {
    return this.findWorkspacePackageRelPathsImpl(rootDir, onGlobWarning);
  }

  private static toPosix(filePath: string): string {
    return filePath.split(path.sep).join("/");
  }

  private static isGlobPermissionError(caughtError: unknown): boolean {
    if (typeof caughtError !== "object" || caughtError === null || !("code" in caughtError)) {
      return false;
    }
    const code = (caughtError as NodeJS.ErrnoException).code;
    return code === "EACCES" || code === "EPERM";
  }

  private static workspacePatternToPackageJsonGlob(pattern: string): string {
    const normalizedPattern = WorkspacePackageDiscovery.toPosix(pattern.trim()).replace(/\/+$/, "");
    if (!normalizedPattern) {
      return "**/package.json";
    }
    return `${normalizedPattern}/package.json`;
  }

  private static splitWorkspacePackageEntries(raw: unknown): {
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

  private static parsePnpmWorkspaceDocument(doc: unknown): {
    include: string[];
    exclude: string[];
    hasPackagesKey: boolean;
    isEmptyPackagesArray: boolean;
  } {
    const wf = WorkspacePackageDiscovery.workspaceFile;
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
      ...WorkspacePackageDiscovery.splitWorkspacePackageEntries(pkgs),
      hasPackagesKey: true,
      isEmptyPackagesArray: false,
    };
  }

  private async readWorkspaceYaml(
    rootDir: string,
  ): Promise<{ exists: false } | { exists: true; doc: unknown }> {
    const wf = WorkspacePackageDiscovery.workspaceFile;
    const workspaceYamlPath = path.join(rootDir, wf);
    if (!this.fs.existsSync(workspaceYamlPath)) {
      return { exists: false };
    }
    let raw: string;
    try {
      raw = await this.fs.readFile(workspaceYamlPath, "utf8");
    } catch (caughtReadError: unknown) {
      throw new Error(`Failed to read ${wf}: ${messageFromCaughtUnknown(caughtReadError)}`);
    }
    let doc: unknown;
    try {
      doc = parseYaml(raw) as unknown;
    } catch (caughtYamlParseError: unknown) {
      throw new Error(`Failed to parse ${wf}: ${messageFromCaughtUnknown(caughtYamlParseError)}`);
    }
    if (doc === null || doc === undefined) {
      throw new Error(`${wf} must define a mapping at the document root`);
    }
    return { exists: true, doc };
  }

  private async findWorkspacePackageRelPathsImpl(
    rootDir: string,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult> {
    const workspaceYaml = await this.readWorkspaceYaml(rootDir);
    const defInc = WorkspacePackageDiscovery.defaultInclude;

    let include: string[];
    let exclude: string[];
    let multiSource: WorkspaceMultiDiscoverySource;

    if (!workspaceYaml.exists) {
      include = [...defInc];
      exclude = [];
      multiSource = "default-patterns";
    } else {
      const parsed = WorkspacePackageDiscovery.parsePnpmWorkspaceDocument(workspaceYaml.doc);
      if (!parsed.hasPackagesKey) {
        include = [...defInc];
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
      const globPat = WorkspacePackageDiscovery.workspacePatternToPackageJsonGlob(pattern);
      let matches: string[];
      try {
        matches = globSync(globPat, globOpts);
      } catch (caughtGlobError: unknown) {
        if (WorkspacePackageDiscovery.isGlobPermissionError(caughtGlobError)) {
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
        const posix = WorkspacePackageDiscovery.toPosix(matchedPath);
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
}
