import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/typescript-source-file-walker.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";

@injectable([inject(CliFsToken)])
export class TypeScriptSourceFileWalker implements TypeScriptSourceFileWalkerPort {
  private static readonly defaultSkipDirs = new Set([
    "node_modules",
    "dist",
    ".git",
    ".turbo",
    ".next",
    ".cache",
    "out",
    "build",
    "coverage",
    ".vercel",
    ".output",
  ]);

  constructor(private readonly fs: CliFs) {}

  walkTsxFiles(rootDirectoryPath: string): string[] {
    const result: string[] = [];
    this.visitTsxPaths(result, rootDirectoryPath);
    return result;
  }

  private visitTsxPaths(result: string[], entryPath: string): void {
    const entryStats = this.fs.statSync(entryPath);
    if (entryStats.isDirectory()) {
      for (const childName of this.fs.readdirSync(entryPath)) {
        if (TypeScriptSourceFileWalker.defaultSkipDirs.has(childName)) {
          continue;
        }
        this.visitTsxPaths(result, path.join(entryPath, childName));
      }
      return;
    }
    if (entryPath.endsWith(".d.ts")) {
      return;
    }
    if (entryPath.endsWith(".tsx") || entryPath.endsWith(".ts")) {
      result.push(entryPath);
    }
  }
}
