import type { SourceFile } from "ts-morph";

import { Project } from "ts-morph";

import type { PackageConfig } from "@/config/schema";
import type { AnalysisResult, ImportPath } from "@/types/imports";

import { createExportPath } from "@/lib/path-utils";

function makeRegexPrefixesToRemove(prefixes: string[]): RegExp {
  // Xây dựng regex để khớp với bất kỳ prefix nào trong danh sách
  // Format: ^\.?\/?(prefix1|prefix2)\/(.*)
  // - ^\.?\/?          : Bắt đầu với ./ hoặc / tùy chọn
  // - (prefix1|prefix2): Bất kỳ prefix nào trong danh sách
  // - \/(.*)           : Đường dẫn còn lại sau prefix
  const prefixPattern = prefixes.join("|");

  return new RegExp(`^.?\\/?(?:${prefixPattern})\\/(.*)$`);
}

function processExportPath(modulePath: string, regexPattern: RegExp): string {
  let processedPath = modulePath;

  const match = processedPath.match(regexPattern);

  if (match) {
    processedPath = match[1];
  }

  return processedPath;
}

/**
 * Phân tích import từ file index.ts
 */
export function analyzeImports(indexFilePath: string, packageConfig: PackageConfig): AnalysisResult {
  const project = new Project();
  let sourceFile: SourceFile;

  try {
    sourceFile = project.addSourceFileAtPath(indexFilePath);
  } catch (error) {
    console.error(`Error loading source file at ${indexFilePath}:`, error);

    return { imports: [] };
  }

  const imports: ImportPath[] = [];
  const prefixesToRemove = packageConfig.exportPathPrefixesToRemove ?? [];

  const regexPattern = makeRegexPrefixesToRemove(prefixesToRemove);

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
    }

    let directory;

    if (parts.length <= 1) {
      directory = ".";
    } else {
      directory = parts.slice(0, -1).join("/");

      // Loại bỏ "./" ở đầu nếu có
      if (directory.startsWith("./")) {
        directory = directory.slice(2);
      }
    }

    const name = parts.at(-1) ?? "";

    const importPath: ImportPath = {
      originalPath: moduleSpecifier,
      directory,
      name,
      exportPath: createExportPath(processExportPath(moduleSpecifier, regexPattern)),
    };

    imports.push(importPath);
  }

  return { imports };
}
