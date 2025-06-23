import { injectable } from "inversify";
import { Project, type SourceFile } from "ts-morph";

import type { AnalysisPort } from "@/application/ports/analysis.port";
import type { AnalysisResult, ImportPath, PackageConfig } from "@/domain/entities/package-config";

@injectable()
export class TsMorphAnalysisAdapter implements AnalysisPort {
  analyzeImports(indexFilePath: string, packageConfig: PackageConfig): AnalysisResult {
    const project = new Project();
    let sourceFile: SourceFile;

    try {
      sourceFile = project.addSourceFileAtPath(indexFilePath);
    } catch (error) {
      console.error(
        `Error loading source file at ${indexFilePath}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      return { imports: [] };
    }

    const imports: ImportPath[] = [];
    const prefixesToRemove = packageConfig.exportPathPrefixesToRemove ?? [];
    const regexPattern = new RegExp(`^.?\\/?(?:${prefixesToRemove.join("|")})\\/(.*)$`);

    for (const exportDecl of sourceFile.getExportDeclarations()) {
      let moduleSpecifier = exportDecl.getModuleSpecifierValue();

      if (!moduleSpecifier) {
        continue;
      }

      // Normalize @/ to ./
      if (moduleSpecifier.startsWith("@/")) {
        moduleSpecifier = `./${moduleSpecifier.slice(2)}`;
      }

      const isExternal = !moduleSpecifier.startsWith(".");

      if (isExternal) {
        continue;
      }

      const parts = moduleSpecifier.split("/").filter(Boolean);

      if (parts.length < 2) {
        continue;
      }

      let directory = parts.length <= 1 ? "." : parts.slice(0, -1).join("/");

      if (directory.startsWith("./")) {
        directory = directory.slice(2);
      }

      const name = parts.at(-1) ?? "";
      const exportPath = this.processExportPath(moduleSpecifier, regexPattern);

      imports.push({
        originalPath: moduleSpecifier,
        directory,
        name,
        exportPath,
      });
    }

    return { imports };
  }

  private processExportPath(modulePath: string, regexPattern: RegExp): string {
    const match = modulePath.match(regexPattern);

    if (match) {
      const remainingPath = match[1];

      return remainingPath.startsWith("./") ? remainingPath : `./${remainingPath}`;
    }

    return modulePath;
  }
}
