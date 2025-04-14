import type { SourceFile } from "ts-morph";

import * as path from "node:path";
import { Project } from "ts-morph";

import type { AnalysisResult, ImportPath } from "@/types/imports";

import { createExportPath } from "@/utils/path-utils";

/**
 * Phân tích import từ file index.ts
 */
export function analyzeImports(indexFilePath: string): AnalysisResult {
  const project = new Project();
  let sourceFile: SourceFile;

  try {
    sourceFile = project.addSourceFileAtPath(indexFilePath);
  } catch (error) {
    console.error(`Error loading source file at ${indexFilePath}:`, error);

    return { imports: [], importsByDir: {} };
  }

  const imports: ImportPath[] = [];

  for (const exportDecl of sourceFile.getExportDeclarations()) {
    let moduleSpecifier = exportDecl.getModuleSpecifierValue();

    if (!moduleSpecifier) {
      continue;
    }

    // Chuẩn hóa @/ thành ./
    if (moduleSpecifier.startsWith("@/")) {
      moduleSpecifier = `./${moduleSpecifier.slice(2)}`; // Thay @/ bằng ./
    }

    const isExternal = !moduleSpecifier.startsWith(".");

    if (isExternal) {
      continue;
    }

    const parts = moduleSpecifier.split("/").filter(Boolean); // Loại bỏ phần rỗng

    if (parts.length < 2) {
      continue;
    } // Bỏ qua ./components

    // Lấy thư mục: nếu chỉ có 1 phần => thư mục gốc ('.'), ngược lại => thư mục đầu tiên
    const directory = parts.length === 1 ? "." : parts[0];

    const name = parts.at(-1) ?? "";

    const importPath: ImportPath = {
      originalPath: moduleSpecifier,
      directory,
      name,
      exportPath: createExportPath(moduleSpecifier),
    };

    imports.push(importPath);
  }

  // Xử lý export * from "./components" hoặc "@/components"
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    let moduleSpecifier = exportDecl.getModuleSpecifierValue();

    if (!moduleSpecifier) {
      continue;
    }

    // Chuẩn hóa @/ thành ./
    if (moduleSpecifier.startsWith("@/")) {
      moduleSpecifier = `./${moduleSpecifier.slice(2)}`;
    }

    const parts = moduleSpecifier.split("/").filter(Boolean);

    if (parts.length !== 1) {
      continue;
    } // Chỉ xử lý ./components hoặc @/components

    const dirPath = path.join(path.dirname(indexFilePath), moduleSpecifier.replace("./", ""));
    const dirIndexPath = path.join(dirPath, "index.ts");

    try {
      if (project.addSourceFileAtPathIfExists(dirIndexPath)) {
        const dirIndexFile = project.getSourceFile(dirIndexPath);

        if (dirIndexFile) {
          for (const dirExport of dirIndexFile.getExportDeclarations()) {
            let subModuleSpecifier = dirExport.getModuleSpecifierValue();

            if (!subModuleSpecifier?.startsWith(".")) {
              continue;
            }

            // Chuẩn hóa @/ trong subModuleSpecifier nếu có
            if (subModuleSpecifier.startsWith("@/")) {
              subModuleSpecifier = `./${subModuleSpecifier.slice(2)}`;
            }

            const dirName = moduleSpecifier.replace("./", "");
            const subParts = subModuleSpecifier.split("/").filter(Boolean);
            const name = subParts.at(-1) ?? "";

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
    } catch (error) {
      console.warn(`Could not analyze ${dirIndexPath}:`, error);
    }
  }

  const importsByDir: Record<string, ImportPath[]> = {};

  for (const importPath of imports) {
    importsByDir[importPath.directory] = importsByDir[importPath.directory] ?? [];
    importsByDir[importPath.directory].push(importPath);
  }

  return { imports, importsByDir };
}
