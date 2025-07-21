/**
 * TS-Morph Tree Shaking Analysis Adapter
 *
 * Infrastructure adapter that implements TreeShakingAnalysisPort using ts-morph library.
 * Following explicit architecture guidelines for CLI applications.
 */

import { injectable } from "inversify";
import fs from "node:fs";
import path from "node:path";
import { Project, SourceFile, Node } from "ts-morph";

import type {
  ExportInfo,
  FileAnalysis,
  TreeShakingAnalysisPort,
  TreeShakingFixOptions,
} from "@/core/application/ports/analysis/tree-shaking.analysis.port";

@injectable()
export class TsMorphTreeShakingAnalysisAdapter implements TreeShakingAnalysisPort {
  private readonly project: Project;

  constructor() {
    this.project = new Project({
      skipFileDependencyResolution: true,
      useInMemoryFileSystem: false,
    });
  }

  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    if (!this.isTypeScriptFile(filePath) || !fs.existsSync(filePath)) {
      throw new Error(`File not found or not a TypeScript file: ${filePath}`);
    }

    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const exports = this.extractExports(sourceFile);
    const hasImplementation = this.hasImplementation(sourceFile);
    const isIntermediateFile = this.isIntermediateFile(sourceFile, exports);
    const reexportDepth = await this.calculateReexportDepth(filePath);

    // Clean up the source file from project
    this.project.removeSourceFile(sourceFile);

    return {
      exports,
      filePath,
      hasImplementation,
      isIntermediateFile,
      reexportDepth,
    };
  }

  async analyzeFiles(filePaths: string[]): Promise<FileAnalysis[]> {
    const analyses: FileAnalysis[] = [];

    for (const filePath of filePaths) {
      try {
        const analysis = await this.analyzeFile(filePath);

        analyses.push(analysis);
      } catch (error) {
        // Skip files that can't be analyzed
        console.warn(`Failed to analyze ${filePath}: ${String(error)}`);
      }
    }

    return analyses;
  }

  async isIntermediateIndexFile(filePath: string): Promise<boolean> {
    const analysis = await this.analyzeFile(filePath);

    return analysis.isIntermediateFile && path.basename(filePath) === "index.ts";
  }

  async calculateReexportDepth(filePath: string, visited = new Set<string>()): Promise<number> {
    if (visited.has(filePath) || visited.size > 10) {
      return visited.size; // Prevent infinite recursion
    }

    visited.add(filePath);

    if (!this.isTypeScriptFile(filePath) || !fs.existsSync(filePath)) {
      return visited.size;
    }

    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const exports = this.extractExports(sourceFile);

    let maxDepth = visited.size;

    for (const exportInfo of exports) {
      if (exportInfo.isReexport && exportInfo.moduleSpecifier) {
        const resolvedPath = this.resolveModulePath(filePath, exportInfo.moduleSpecifier);

        if (resolvedPath) {
          const depth = await this.calculateReexportDepth(resolvedPath, new Set(visited));

          maxDepth = Math.max(maxDepth, depth);
        }
      }
    }

    this.project.removeSourceFile(sourceFile);

    return maxDepth;
  }

  async getReexportedFiles(filePath: string): Promise<string[]> {
    const analysis = await this.analyzeFile(filePath);
    const reexportedFiles: string[] = [];

    for (const exportInfo of analysis.exports) {
      if (exportInfo.isReexport && exportInfo.moduleSpecifier) {
        const resolvedPath = this.resolveModulePath(filePath, exportInfo.moduleSpecifier);

        if (resolvedPath) {
          reexportedFiles.push(resolvedPath);
        }
      }
    }

    return reexportedFiles;
  }

  async flattenExports(intermediateFiles: string[], options: TreeShakingFixOptions): Promise<void> {
    const { createBackup = true, removeIntermediateFiles = false, targetIndexFile } = options;

    if (createBackup) {
      this.createBackup(targetIndexFile);
    }

    // Collect all exports from intermediate files
    const allExports: ExportInfo[] = [];
    const exportSources = new Map<string, string>();

    for (const intermediateFile of intermediateFiles) {
      const analysis = await this.analyzeFile(intermediateFile);

      for (const exportInfo of analysis.exports) {
        if (exportInfo.isReexport && exportInfo.moduleSpecifier) {
          // Resolve the actual source of the export
          const resolvedPath = this.resolveModulePath(intermediateFile, exportInfo.moduleSpecifier);

          if (resolvedPath) {
            const relativePath = path.relative(path.dirname(targetIndexFile), resolvedPath);
            const normalizedPath = relativePath.startsWith(".")
              ? relativePath
              : `./${relativePath}`;

            if (exportInfo.type === "wildcard") {
              // Convert wildcard to named exports
              const namedExports = this.convertWildcardToNamed(
                intermediateFile,
                exportInfo.moduleSpecifier,
              );

              for (const namedExport of namedExports) {
                allExports.push({
                  column: exportInfo.column,
                  isReexport: true,
                  isTypeOnly: exportInfo.isTypeOnly,
                  line: exportInfo.line,
                  moduleSpecifier: normalizedPath,
                  name: namedExport,
                  type: "named",
                });
              }
            } else {
              allExports.push({
                ...exportInfo,
                moduleSpecifier: normalizedPath,
              });
            }

            exportSources.set(exportInfo.name ?? "*", resolvedPath);
          }
        }
      }
    }

    // Generate flattened export statements
    const exportStatements = this.generateExportStatements(allExports, options);

    // Write to target index file
    this.writeFile(targetIndexFile, exportStatements);

    // Remove intermediate files if requested
    if (removeIntermediateFiles) {
      for (const intermediateFile of intermediateFiles) {
        if (fs.existsSync(intermediateFile)) {
          fs.unlinkSync(intermediateFile);
        }
      }
    }
  }

  convertWildcardToNamed(filePath: string, moduleSpecifier: string): string[] {
    const resolvedPath = this.resolveModulePath(filePath, moduleSpecifier);

    if (!resolvedPath) {
      return [];
    }

    return this.getExportedSymbols(resolvedPath);
  }

  getExportedSymbols(filePath: string): string[] {
    if (!this.isTypeScriptFile(filePath) || !fs.existsSync(filePath)) {
      return [];
    }

    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const symbols: string[] = [];

    // Get exported declarations
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    for (const [name] of exportedDeclarations) {
      if (name !== "default") {
        symbols.push(name);
      }
    }

    this.project.removeSourceFile(sourceFile);

    return symbols;
  }

  isTypeScriptFile(filePath: string): boolean {
    return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
  }

  createBackup(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return "";
    }

    const backupPath = `${filePath}.backup.${Date.now()}`;

    fs.copyFileSync(filePath, backupPath);

    return backupPath;
  }

  writeFile(filePath: string, content: string): void {
    const directory = path.dirname(filePath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf8");
  }

  private extractExports(sourceFile: SourceFile): ExportInfo[] {
    const exports: ExportInfo[] = [];

    // Export declarations
    for (const exportDecl of sourceFile.getExportDeclarations()) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      const isTypeOnly = exportDecl.isTypeOnly();
      const line = exportDecl.getStartLineNumber();
      const column = exportDecl.getStart() - exportDecl.getStartLinePos();

      if (exportDecl.isNamespaceExport()) {
        // export * from './module'
        exports.push({
          column,
          isReexport: !!moduleSpecifier,
          isTypeOnly,
          line,
          moduleSpecifier,
          type: "wildcard",
        });
      } else {
        // export { name1, name2 } from './module'
        const namedExports = exportDecl.getNamedExports();

        for (const namedExport of namedExports) {
          exports.push({
            column,
            isReexport: !!moduleSpecifier,
            isTypeOnly,
            line,
            moduleSpecifier,
            name: namedExport.getName(),
            type: "named",
          });
        }
      }
    }

    // Export assignments (export = )
    for (const exportAssign of sourceFile.getExportAssignments()) {
      if (!exportAssign.isExportEquals()) {
        exports.push({
          column: exportAssign.getStart() - exportAssign.getStartLinePos(),
          isReexport: false,
          isTypeOnly: false,
          line: exportAssign.getStartLineNumber(),
          name: "default",
          type: "default",
        });
      }
    }

    // Exported functions, classes, interfaces, etc.
    for (const statement of sourceFile.getStatements()) {
      if (Node.isExportable(statement) && statement.hasExportKeyword()) {
        let name = "default";

        // Get name based on statement type
        if (
          Node.isFunctionDeclaration(statement) ||
          Node.isClassDeclaration(statement) ||
          Node.isInterfaceDeclaration(statement) ||
          Node.isTypeAliasDeclaration(statement) ||
          Node.isVariableStatement(statement)
        ) {
          if ("getName" in statement && typeof statement.getName === "function") {
            name = statement.getName() ?? "default";
          } else if (Node.isVariableStatement(statement)) {
            const declarations = statement.getDeclarationList().getDeclarations();

            if (declarations.length > 0) {
              name = declarations[0].getName();
            }
          }
        }

        const isTypeOnly =
          Node.isInterfaceDeclaration(statement) || Node.isTypeAliasDeclaration(statement);

        exports.push({
          column: statement.getStart() - statement.getStartLinePos(),
          isReexport: false,
          isTypeOnly,
          line: statement.getStartLineNumber(),
          name,
          type: name === "default" ? "default" : "named",
        });
      }
    }

    return exports;
  }

  private hasImplementation(sourceFile: SourceFile): boolean {
    // Check if file has any actual implementation beyond just exports
    const statements = sourceFile.getStatements();

    for (const statement of statements) {
      // Skip import/export statements
      if (
        Node.isImportDeclaration(statement) ||
        Node.isExportDeclaration(statement) ||
        Node.isExportAssignment(statement)
      ) {
        continue;
      }

      // Skip type-only declarations
      if (Node.isInterfaceDeclaration(statement) || Node.isTypeAliasDeclaration(statement)) {
        continue;
      }

      // If we find any other statement, it has implementation
      return true;
    }

    return false;
  }

  private isIntermediateFile(sourceFile: SourceFile, exports: ExportInfo[]): boolean {
    // A file is intermediate if:
    // 1. It has no actual implementation
    // 2. All exports are re-exports
    if (this.hasImplementation(sourceFile)) {
      return false;
    }

    return exports.length > 0 && exports.every((exp) => exp.isReexport);
  }

  private resolveModulePath(fromFile: string, moduleSpecifier: string): null | string {
    if (!moduleSpecifier.startsWith(".")) {
      return null; // External module
    }

    const fromDirectory = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDirectory, moduleSpecifier);

    // Try different extensions
    const extensions = [".ts", ".tsx", "/index.ts", "/index.tsx"];

    for (const extension of extensions) {
      const fullPath = resolvedPath + extension;

      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  private generateExportStatements(exports: ExportInfo[], options: TreeShakingFixOptions): string {
    const { preserveTypeExports = true } = options;
    const exportsByModule = new Map<string, ExportInfo[]>();

    // Group exports by module
    for (const exportInfo of exports) {
      if (!exportInfo.moduleSpecifier) continue;

      const key = exportInfo.moduleSpecifier;

      if (!exportsByModule.has(key)) {
        exportsByModule.set(key, []);
      }

      exportsByModule.get(key)?.push(exportInfo);
    }

    const statements: string[] = [];

    // Generate export statements for each module
    for (const [moduleSpecifier, moduleExports] of exportsByModule) {
      const namedExports = moduleExports.filter((exp) => exp.type === "named" && !exp.isTypeOnly);
      const typeExports = moduleExports.filter((exp) => exp.type === "named" && exp.isTypeOnly);

      if (namedExports.length > 0) {
        const names = namedExports
          .map((exp) => exp.name)
          .filter(Boolean)
          .join(", ");

        statements.push(`export { ${names} } from '${moduleSpecifier}';`);
      }

      if (preserveTypeExports && typeExports.length > 0) {
        const typeNames = typeExports
          .map((exp) => exp.name)
          .filter(Boolean)
          .join(", ");

        statements.push(`export type { ${typeNames} } from '${moduleSpecifier}';`);
      }
    }

    return statements.join("\n") + "\n";
  }
}
