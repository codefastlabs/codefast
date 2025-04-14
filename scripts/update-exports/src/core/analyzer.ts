import type { SourceFile } from "ts-morph";

import path from "node:path";
import { Project } from "ts-morph";

import type { AnalysisResult, ImportPath } from "@/types/imports";

import { createExportPath } from "@/utils/path-utils";

/**
 * Phân tích import từ file index.ts
 */
export function analyzeImports(indexFilePath: string): AnalysisResult {
  const project = new Project();

  // Thêm file vào project
  let sourceFile: SourceFile;

  try {
    sourceFile = project.addSourceFileAtPath(indexFilePath);
  } catch (error) {
    console.error(`Error loading source file at ${indexFilePath}:`, error);

    return { imports: [], importsByDir: {} };
  }

  // Lấy tất cả export declarations
  const exportDeclarations = sourceFile.getExportDeclarations();

  // Mảng lưu trữ các đường dẫn import
  const imports: ImportPath[] = [];

  // Xử lý từng export declaration
  for (const exportDecl of exportDeclarations) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue();

    if (moduleSpecifier) {
      // Bỏ qua export from 'external-package'
      if (!moduleSpecifier.startsWith(".")) {
        continue;
      }

      // Phân tích đường dẫn
      const parts = moduleSpecifier.split("/");

      if (parts.length === 1) {
        // Trường hợp './components'
        // Cần check file con
        continue;
      }

      // Lấy thư mục và tên module
      const directory = parts[1]; // 'components', 'lib', etc.
      const name = (parts.length > 2 ? parts.at(-1) : "")!;

      const importPath: ImportPath = {
        originalPath: moduleSpecifier,
        directory,
        name,
        exportPath: createExportPath(moduleSpecifier),
      };

      imports.push(importPath);
    }
  }

  // Xử lý các trường hợp 'export * from "./components"'
  for (const exportDecl of exportDeclarations) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue();

    if (moduleSpecifier && moduleSpecifier.split("/").length === 1) {
      const dirPath = path.join(path.dirname(indexFilePath), moduleSpecifier.replace("./", ""));
      const dirIndexPath = path.join(dirPath, "index.ts");

      // Nếu tồn tại index.ts trong thư mục, phân tích nó
      try {
        if (project.getSourceFile(dirIndexPath) || project.addSourceFileAtPathIfExists(dirIndexPath)) {
          const dirIndexFile = project.getSourceFile(dirIndexPath);

          if (dirIndexFile) {
            const dirExports = dirIndexFile.getExportDeclarations();

            for (const dirExport of dirExports) {
              const subModuleSpecifier = dirExport.getModuleSpecifierValue();

              if (subModuleSpecifier?.startsWith(".")) {
                // Tạo đường dẫn tuyệt đối cho module
                const dirName = moduleSpecifier.replace("./", "");
                const subParts = subModuleSpecifier.split("/");
                const name = subParts.at(-1)!;

                const importPath: ImportPath = {
                  originalPath: `${moduleSpecifier}/${subModuleSpecifier.replace("./", "")}`,
                  directory: dirName,
                  name,
                  exportPath: createExportPath(`${moduleSpecifier}/${name}`),
                };

                imports.push(importPath);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Could not analyze ${dirIndexPath}:`, error);
      }
    }
  }

  // Nhóm imports theo thư mục
  const importsByDir: Record<string, ImportPath[]> = {};

  for (const importPath of imports) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- keep
    if (!importsByDir[importPath.directory]) {
      importsByDir[importPath.directory] = [];
    }

    importsByDir[importPath.directory].push(importPath);
  }

  return { imports, importsByDir };
}
