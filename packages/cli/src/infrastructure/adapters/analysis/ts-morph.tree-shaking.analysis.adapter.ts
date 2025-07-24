/**
 * TS-Morph Tree Shaking Analysis Adapter
 *
 * Infrastructure adapter that implements TreeShakingAnalysisPort using ts-morph library.
 * Following explicit architecture guidelines for CLI applications.
 */

import { injectable } from "inversify";
import fs from "node:fs";
import path from "node:path";
import { Project, SourceFile, Node, SyntaxKind } from "ts-morph";

import type {
  AutoFixPreview,
  BackupInfo,
  ComprehensiveAutoFixOptions,
  ExportInfo,
  FileAnalysis,
  LeafDirectory,
  TreeShakingAnalysisPort,
  TreeShakingFixOptions,
} from "../../../application/ports/analysis/tree-shaking.analysis.port";

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

    // Clean up the source file from a project
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

    // Write to target an index file
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

  // Comprehensive Auto-Fix Methods

  async scanLeafDirectories(
    rootPath: string,
    options: ComprehensiveAutoFixOptions = {},
  ): Promise<LeafDirectory[]> {
    const leafDirectories: LeafDirectory[] = [];
    const excludeDirectories = options.excludeDirectories ?? [
      "node_modules",
      "dist",
      "build",
      ".turbo",
      "coverage",
    ];

    const scanDirectory = async (currentPath: string): Promise<void> => {
      if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) {
        return;
      }

      const directoryName = path.basename(currentPath);

      if (excludeDirectories.includes(directoryName)) {
        return;
      }

      const isLeaf = this.isLeafDirectory(currentPath);

      if (isLeaf) {
        const moduleFiles = this.getModuleFilesInDirectory(currentPath);

        if (moduleFiles.length > 0) {
          const hasIndexFile =
            fs.existsSync(path.join(currentPath, "index.ts")) ||
            fs.existsSync(path.join(currentPath, "index.tsx"));

          leafDirectories.push({
            files: moduleFiles,
            hasIndexFile,
            name: directoryName,
            parentPath: path.dirname(currentPath),
            path: currentPath,
          });
        }
      } else {
        // Recursively scan subdirectories
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            await scanDirectory(path.join(currentPath, entry.name));
          }
        }
      }
    };

    await scanDirectory(rootPath);

    return leafDirectories;
  }

  isLeafDirectory(directoryPath: string): boolean {
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      return false;
    }

    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    const hasModuleFiles = entries.some(
      (entry) =>
        entry.isFile() &&
        this.isTypeScriptFile(entry.name) &&
        !entry.name.includes(".test.") &&
        !entry.name.includes(".spec."),
    );

    if (!hasModuleFiles) {
      return false;
    }

    // Check if any subdirectories contain module files
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !["node_modules", "dist", "build", ".turbo", "coverage"].includes(entry.name)
      ) {
        const subDirectoryPath = path.join(directoryPath, entry.name);
        const subDirectoryFiles = this.getModuleFilesInDirectory(subDirectoryPath);

        if (subDirectoryFiles.length > 0) {
          return false; // Not a leaf if subdirectories have modules
        }
      }
    }

    return true;
  }

  getModuleFilesInDirectory(directoryPath: string): string[] {
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      return [];
    }

    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    const moduleFiles: string[] = [];

    for (const entry of entries) {
      if (
        entry.isFile() &&
        this.isTypeScriptFile(entry.name) &&
        !entry.name.includes(".test.") &&
        !entry.name.includes(".spec.") &&
        entry.name !== "index.ts" &&
        entry.name !== "index.tsx"
      ) {
        moduleFiles.push(path.join(directoryPath, entry.name));
      }
    }

    return moduleFiles;
  }

  generateIndexContent(moduleFiles: string[], options: ComprehensiveAutoFixOptions = {}): string {
    const preserveTypeExports = options.preserveTypeExports ?? true;
    const lines: string[] = [];
    const processedModules = new Set<string>();

    for (const filePath of moduleFiles) {
      const fileName = path.basename(filePath, path.extname(filePath));
      const relativePath = `./${fileName}`;

      if (processedModules.has(fileName)) {
        continue;
      }

      processedModules.add(fileName);

      try {
        const sourceFile = this.project.addSourceFileAtPath(filePath);
        const exportedDeclarations = sourceFile.getExportedDeclarations();

        const valueExports: string[] = [];
        const typeExports: string[] = [];

        for (const [name, declarations] of exportedDeclarations) {
          if (name === "default") {
            continue; // Skip default exports for now
          }

          // Check if this is a type-only export
          const isTypeOnly = declarations.some(
            (decl) =>
              decl.getKind() === SyntaxKind.InterfaceDeclaration ||
              decl.getKind() === SyntaxKind.TypeAliasDeclaration ||
              decl.getKind() === SyntaxKind.EnumDeclaration,
          );

          if (isTypeOnly && preserveTypeExports) {
            typeExports.push(name);
          } else {
            valueExports.push(name);
          }
        }

        // Add value exports
        if (valueExports.length > 0) {
          lines.push(`export { ${valueExports.join(", ")} } from "${relativePath}";`);
        }

        // Add type exports
        if (typeExports.length > 0 && preserveTypeExports) {
          lines.push(`export type { ${typeExports.join(", ")} } from "${relativePath}";`);
        }

        this.project.removeSourceFile(sourceFile);
      } catch {
        // If we can't analyze the file, create a simple export
        lines.push(`export * from "${relativePath}";`);
      }
    }

    return lines.join("\n") + "\n";
  }

  createIndexFileForLeafDirectory(
    leafDirectory: LeafDirectory,
    options: ComprehensiveAutoFixOptions = {},
  ): string {
    const indexPath = path.join(leafDirectory.path, "index.ts");

    if (leafDirectory.hasIndexFile && !options.preview) {
      throw new Error(`Index file already exists at ${indexPath}`);
    }

    const content = this.generateIndexContent(leafDirectory.files, options);

    if (!options.preview) {
      if (options.createBackup && fs.existsSync(indexPath)) {
        this.createBackup(indexPath);
      }

      this.writeFile(indexPath, content);
    }

    return indexPath;
  }

  convertWildcardExportsToNamed(filePath: string, options: ComprehensiveAutoFixOptions = {}): void {
    if (!this.isTypeScriptFile(filePath) || !fs.existsSync(filePath)) {
      return;
    }

    if (options.createBackup) {
      this.createBackup(filePath);
    }

    const sourceFile = this.project.addSourceFileAtPath(filePath);
    let hasChanges = false;

    // Find all wildcard exports
    const exportDeclarations = sourceFile.getExportDeclarations();

    for (const exportDecl of exportDeclarations) {
      if (exportDecl.isNamespaceExport()) {
        const moduleSpecifier = exportDecl.getModuleSpecifierValue();

        if (moduleSpecifier) {
          const resolvedPath = this.resolveModulePath(filePath, moduleSpecifier);

          if (resolvedPath) {
            const exportedSymbols = this.getExportedSymbols(resolvedPath);

            if (exportedSymbols.length > 0) {
              // Replace wildcard export with named exports
              const namedExports = exportedSymbols.join(", ");
              const isTypeOnly = exportDecl.isTypeOnly();
              const typePrefix = isTypeOnly ? "type " : "";

              exportDecl.replaceWithText(
                `export ${typePrefix}{ ${namedExports} } from "${moduleSpecifier}";`,
              );
              hasChanges = true;
            }
          }
        }
      }
    }

    if (hasChanges && !options.preview) {
      sourceFile.saveSync();
    }

    this.project.removeSourceFile(sourceFile);
  }

  async generateAutoFixPreview(
    packagePath: string,
    options: ComprehensiveAutoFixOptions = {},
  ): Promise<AutoFixPreview> {
    const preview: AutoFixPreview = {
      backupFiles: [],
      filesToCreate: [],
      filesToDelete: [],
      filesToModify: [],
      summary: {
        deepReexportChainsFixed: 0,
        indexFilesCreated: 0,
        intermediateFilesFlattened: 0,
        wildcardExportsConverted: 0,
      },
    };

    // Scan for leaf directories that need index files
    const leafDirectories = await this.scanLeafDirectories(packagePath, options);

    for (const leafDirectory of leafDirectories) {
      if (!leafDirectory.hasIndexFile) {
        const indexPath = path.join(leafDirectory.path, "index.ts");

        preview.filesToCreate.push(indexPath);
        preview.summary.indexFilesCreated++;
      }
    }

    // Find files with wildcard exports
    const srcPath = path.join(packagePath, "src");

    if (fs.existsSync(srcPath)) {
      const indexFiles = this.findIndexFiles(srcPath);

      for (const indexFile of indexFiles) {
        const analysis = await this.analyzeFile(indexFile);
        const wildcardExports = analysis.exports.filter((exp) => exp.type === "wildcard");

        if (wildcardExports.length > 0) {
          preview.filesToModify.push(indexFile);
          preview.summary.wildcardExportsConverted += wildcardExports.length;

          if (options.createBackup) {
            preview.backupFiles.push(`${indexFile}.backup.${Date.now()}`);
          }
        }
      }
    }

    return preview;
  }

  async applyComprehensiveAutoFix(
    packagePath: string,
    options: ComprehensiveAutoFixOptions = {},
  ): Promise<BackupInfo[]> {
    const backupInfos: BackupInfo[] = [];
    const timestamp = Date.now();

    try {
      // Step 1: Scan for leaf directories and create index files
      const leafDirectories = await this.scanLeafDirectories(packagePath, options);

      for (const leafDirectory of leafDirectories) {
        if (!leafDirectory.hasIndexFile) {
          this.createIndexFileForLeafDirectory(leafDirectory, options);
        }
      }

      // Step 2: Convert wildcard exports to named exports
      const srcPath = path.join(packagePath, "src");

      if (fs.existsSync(srcPath)) {
        const indexFiles = this.findIndexFiles(srcPath);

        for (const indexFile of indexFiles) {
          const analysis = await this.analyzeFile(indexFile);
          const wildcardExports = analysis.exports.filter((exp) => exp.type === "wildcard");

          if (wildcardExports.length > 0) {
            if (options.createBackup) {
              const backupPath = this.createBackup(indexFile);

              backupInfos.push({
                backupPath,
                isValid: true,
                originalPath: indexFile,
                timestamp,
              });
            }

            this.convertWildcardExportsToNamed(indexFile, options);
          }
        }
      }

      // Step 3: Flatten intermediate files if requested
      if (options.removeIntermediateFiles) {
        const intermediateFiles = await this.findIntermediateFiles(packagePath);

        if (intermediateFiles.length > 0) {
          const mainIndexFile = path.join(packagePath, "src", "index.ts");

          if (fs.existsSync(mainIndexFile)) {
            await this.flattenExports(intermediateFiles, {
              createBackup: options.createBackup,
              preserveTypeExports: options.preserveTypeExports,
              removeIntermediateFiles: true,
              targetIndexFile: mainIndexFile,
            });
          }
        }
      }

      return backupInfos;
    } catch (error) {
      // If something goes wrong, restore from backups
      if (backupInfos.length > 0) {
        this.restoreFromBackup(backupInfos);
      }

      throw error;
    }
  }

  restoreFromBackup(backupInfos: BackupInfo[]): void {
    for (const backupInfo of backupInfos) {
      if (backupInfo.isValid && fs.existsSync(backupInfo.backupPath)) {
        try {
          fs.copyFileSync(backupInfo.backupPath, backupInfo.originalPath);
          // Clean up the backup file after successful restore
          fs.unlinkSync(backupInfo.backupPath);
        } catch (error) {
          console.warn(
            `Failed to restore ${backupInfo.originalPath} from backup: ${String(error)}`,
          );
        }
      }
    }
  }

  cleanupBackups(packagePath: string, olderThanDays = 7): void {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const findBackupFiles = (directory: string): void => {
      if (!fs.existsSync(directory)) return;

      const entries = fs.readdirSync(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          findBackupFiles(fullPath);
        } else if (entry.isFile() && entry.name.includes(".backup.")) {
          try {
            const stats = fs.statSync(fullPath);

            if (stats.mtime.getTime() < cutoffTime) {
              fs.unlinkSync(fullPath);
            }
          } catch {
            // Ignore errors when cleaning up backup files
          }
        }
      }
    };

    findBackupFiles(packagePath);
  }

  validateGeneratedExports(indexFilePath: string, moduleFiles: string[]): boolean {
    if (!fs.existsSync(indexFilePath)) {
      return false;
    }

    try {
      const sourceFile = this.project.addSourceFileAtPath(indexFilePath);
      const indexExports = sourceFile.getExportedDeclarations();

      // Check that all expected exports are present
      for (const moduleFile of moduleFiles) {
        const moduleSourceFile = this.project.addSourceFileAtPath(moduleFile);
        const moduleExports = moduleSourceFile.getExportedDeclarations();

        for (const [exportName] of moduleExports) {
          if (exportName !== "default" && !indexExports.has(exportName)) {
            this.project.removeSourceFile(sourceFile);
            this.project.removeSourceFile(moduleSourceFile);

            return false;
          }
        }

        this.project.removeSourceFile(moduleSourceFile);
      }

      this.project.removeSourceFile(sourceFile);

      return true;
    } catch {
      return false;
    }
  }

  private findIndexFiles(rootPath: string): string[] {
    const indexFiles: string[] = [];

    const scanDirectory = (currentPath: string): void => {
      if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) {
        return;
      }

      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isFile() && (entry.name === "index.ts" || entry.name === "index.tsx")) {
          indexFiles.push(fullPath);
        } else if (
          entry.isDirectory() &&
          !["node_modules", "dist", "build", ".turbo", "coverage"].includes(entry.name)
        ) {
          scanDirectory(fullPath);
        }
      }
    };

    scanDirectory(rootPath);

    return indexFiles;
  }

  private async findIntermediateFiles(packagePath: string): Promise<string[]> {
    const srcPath = path.join(packagePath, "src");
    const mainIndexFile = path.join(srcPath, "index.ts");
    const indexFiles = this.findIndexFiles(srcPath);

    const intermediateFiles: string[] = [];

    for (const indexFile of indexFiles) {
      if (indexFile !== mainIndexFile) {
        const isIntermediate = await this.isIntermediateIndexFile(indexFile);

        if (isIntermediate) {
          intermediateFiles.push(indexFile);
        }
      }
    }

    return intermediateFiles;
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

        // Get a name based on a statement type
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
    // Check if a file has any actual implementation beyond just exports
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
