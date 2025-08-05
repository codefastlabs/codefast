import { injectable } from "inversify";
import { Project, SourceFile, Node } from "ts-morph";

import type {
  TypeScriptParserPort,
  ParsedFile,
} from "../../application/ports/typescript-parser.port";
import type { ExportInfo, ExportType } from "../../domain/shared/types";

@injectable()
export class TsMorphAdapter implements TypeScriptParserPort {
  private readonly project: Project;

  constructor() {
    this.project = new Project({
      compilerOptions: {
        allowJs: true,
        declaration: false,
        jsx: 4, // React JSX
        module: 99, // ESNext
        skipLibCheck: true,
        target: 99, // Latest
      },
      useInMemoryFileSystem: true,
    });
  }

  async parseFile(filePath: string): Promise<ParsedFile> {
    try {
      // Read file content first, then create source file from content
      const fs = await import("node:fs/promises");
      const content = await fs.readFile(filePath, "utf8");

      return this.parseContent(content, filePath);
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error}`);
    }
  }

  async parseContent(content: string, filePath: string): Promise<ParsedFile> {
    try {
      const sourceFile = this.project.createSourceFile(filePath, content, { overwrite: true });

      return this.parseSourceFile(sourceFile, filePath);
    } catch (error) {
      throw new Error(`Failed to parse content for ${filePath}: ${error}`);
    }
  }

  private parseSourceFile(sourceFile: SourceFile, filePath: string): ParsedFile {
    const exports: ExportInfo[] = [];
    const hasReactImport = this.hasReactImport(sourceFile);
    const isTypeScriptReact = filePath.endsWith(".tsx");

    // Parse named exports
    for (const exportDecl of sourceFile.getExportDeclarations()) {
      for (const namedExport of exportDecl.getNamedExports()) {
        const name = namedExport.getName();
        const isTypeOnlyExport = exportDecl.isTypeOnly() || namedExport.isTypeOnly();

        exports.push({
          isComponent: this.isLikelyComponent(name) && !isTypeOnlyExport,
          isInterface: isTypeOnlyExport && (name.endsWith("Props") || name.endsWith("Type")),
          isType: isTypeOnlyExport,
          name,
          type: "named" as ExportType,
        });
      }
    }

    // Parse export assignments and declarations
    for (const exportAssign of sourceFile.getExportAssignments()) {
      if (exportAssign.isExportEquals()) {
        const expression = exportAssign.getExpression();

        if (Node.isIdentifier(expression)) {
          exports.push({
            isComponent: this.isLikelyComponent(expression.getText()),
            isInterface: false,
            isType: false,
            name: expression.getText(),
            type: "namespace" as ExportType,
          });
        }
      }
    }

    // Parse function declarations with export modifier
    for (const function_ of sourceFile.getFunctions()) {
      if (function_.hasExportKeyword()) {
        const name = function_.getName();

        if (name) {
          exports.push({
            isComponent: this.isLikelyComponent(name),
            isInterface: false,
            isType: false,
            name,
            type: function_.hasDefaultKeyword() ? "default" : "named",
          });
        }
      }
    }

    // Parse variable declarations with export modifier
    for (const variableStatement of sourceFile.getVariableStatements()) {
      if (variableStatement.hasExportKeyword()) {
        for (const decl of variableStatement.getDeclarations()) {
          const name = decl.getName();

          exports.push({
            isComponent: this.isLikelyComponent(name),
            isInterface: false,
            isType: false,
            name,
            type: variableStatement.hasDefaultKeyword() ? "default" : "named",
          });
        }
      }
    }

    // Parse interface declarations with export modifier
    for (const interfaceDecl of sourceFile.getInterfaces()) {
      if (interfaceDecl.hasExportKeyword()) {
        const name = interfaceDecl.getName();

        exports.push({
          isComponent: false,
          isInterface: true,
          isType: false,
          name,
          type: "named" as ExportType,
        });
      }
    }

    // Parse type alias declarations with export modifier
    for (const typeAlias of sourceFile.getTypeAliases()) {
      if (typeAlias.hasExportKeyword()) {
        const name = typeAlias.getName();

        exports.push({
          isComponent: false,
          isInterface: false,
          isType: true,
          name,
          type: "named" as ExportType,
        });
      }
    }

    return {
      exports,
      filePath,
      hasReactImport,
      isTypeScriptReact,
    };
  }

  private hasReactImport(sourceFile: SourceFile): boolean {
    return sourceFile.getImportDeclarations().some((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      return moduleSpecifier === "react" || moduleSpecifier.startsWith("react/");
    });
  }

  private isLikelyComponent(name: string): boolean {
    // Component names typically start with uppercase letter
    return /^[A-Z]/.test(name) && !name.endsWith("Props") && !name.endsWith("Type");
  }
}
