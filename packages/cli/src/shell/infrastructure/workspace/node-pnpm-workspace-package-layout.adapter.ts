import { globSync } from "node:fs";
import path from "node:path";
import picomatch from "picomatch";
import { parse as parseYaml } from "yaml";
import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type {
  WorkspacePackageLayoutOutcome,
  WorkspacePackageLayoutPort,
  WorkspacePackageLayoutSource,
} from "#/shell/application/ports/outbound/workspace-package-layout.port";
import { CliFilesystemPortToken, CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";

/**
 * Node/pnpm implementation: read `pnpm-workspace.yaml`, expand globs to package dirs.
 */
@injectable([inject(CliFilesystemPortToken), inject(CliLoggerPortToken)])
export class NodePnpmWorkspacePackageLayoutAdapter implements WorkspacePackageLayoutPort {
  private readonly workspaceYamlFileName = "pnpm-workspace.yaml";
  private readonly defaultIncludePatterns = ["packages/*"];
  private readonly packageJsonFileName = "package.json";

  constructor(
    private readonly fs: CliFilesystemPort,
    private readonly logger: CliLoggerPort,
  ) {}

  async listPackageDirectoryPathsAbsolute(
    rootDirectoryPathAbsolute: string,
    suppressGlobPermissionDiagnostics?: boolean,
  ): Promise<WorkspacePackageLayoutOutcome> {
    return this.collectPackageDirectoryPathsAbsolute(
      rootDirectoryPathAbsolute,
      !!suppressGlobPermissionDiagnostics,
    );
  }

  private toPosix(filePath: string): string {
    return filePath.split(path.sep).join("/");
  }

  private isGlobPermissionError(caughtError: unknown): boolean {
    if (typeof caughtError !== "object" || caughtError === null || !("code" in caughtError)) {
      return false;
    }
    const code = (caughtError as NodeJS.ErrnoException).code;
    return code === "EACCES" || code === "EPERM";
  }

  private workspacePatternToPackageJsonGlob(pattern: string): string {
    const normalizedPattern = this.toPosix(pattern.trim()).replace(/\/+$/, "");
    if (!normalizedPattern) {
      return `**/${this.packageJsonFileName}`;
    }
    return `${normalizedPattern}/${this.packageJsonFileName}`;
  }

  private splitPnpmWorkspacePackagesArray(raw: unknown): { include: string[]; exclude: string[] } {
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

  private parsePnpmWorkspaceDocument(doc: unknown): {
    include: string[];
    exclude: string[];
    hasPackagesKey: boolean;
    isEmptyPackagesArray: boolean;
  } {
    const wf = this.workspaceYamlFileName;
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
      ...this.splitPnpmWorkspacePackagesArray(pkgs),
      hasPackagesKey: true,
      isEmptyPackagesArray: false,
    };
  }

  private async readWorkspaceYaml(
    rootDir: string,
  ): Promise<{ exists: false } | { exists: true; doc: unknown }> {
    const wf = this.workspaceYamlFileName;
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

  private async collectPackageDirectoryPathsAbsolute(
    rootDir: string,
    suppressGlobPermissionDiagnostics: boolean,
  ): Promise<WorkspacePackageLayoutOutcome> {
    const workspaceYaml = await this.readWorkspaceYaml(rootDir);
    const defInc = this.defaultIncludePatterns;

    let include: string[];
    let exclude: string[];
    let layoutSource: WorkspacePackageLayoutSource;
    const hasPnpmWorkspaceYamlFile = workspaceYaml.exists;

    if (!workspaceYaml.exists) {
      include = [...defInc];
      exclude = [];
      layoutSource = "default-patterns";
    } else {
      const parsed = this.parsePnpmWorkspaceDocument(workspaceYaml.doc);
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
      cwd: rootDir,
      posix: true as const,
      ...(path.sep === "\\" ? { windowsPathsNoEscape: true as const } : {}),
    };

    for (const pattern of include) {
      const globPat = this.workspacePatternToPackageJsonGlob(pattern);
      let matches: string[];
      try {
        matches = globSync(globPat, globOpts);
      } catch (caughtGlobError: unknown) {
        if (this.isGlobPermissionError(caughtGlobError)) {
          if (!suppressGlobPermissionDiagnostics) {
            this.logger.out(
              `⚠ Skipping workspace glob "${pattern}" (${messageFromCaughtUnknown(caughtGlobError)})`,
            );
          }
          continue;
        }
        throw new Error(
          `Invalid workspace glob "${pattern}": ${messageFromCaughtUnknown(caughtGlobError)}`,
        );
      }
      for (const matchedPath of matches) {
        const posix = this.toPosix(matchedPath);
        const suffix = `/${this.packageJsonFileName}`;
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
      path.resolve(rootDir, rel.split("/").join(path.sep)),
    );

    return {
      packageDirectoryPathsAbsolute,
      layoutSource,
      hasPnpmWorkspaceYamlFile,
    };
  }
}
