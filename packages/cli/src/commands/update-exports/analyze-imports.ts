import { type SourceFile, Project } from "ts-morph";

import type { AnalysisResult, ImportPath, PackageConfig } from "@/commands/update-exports/types";

/**
 * Creates a regex to remove specified prefixes from paths
 * @param prefixes - Array of prefixes to remove
 * @returns RegExp matching any prefix
 */
function makeRegexPrefixesToRemove(prefixes: string[]): RegExp {
  // Matches: ^\.?\/?(prefix1|prefix2)\/(.*)
  // - ^\.?\/?          : Optional ./ or /
  // - (prefix1|prefix2): Any prefix from the list
  // - \/(.*)           : Remaining path after prefix
  const prefixPattern = prefixes.join("|");

  return new RegExp(`^.?\\/?(?:${prefixPattern})\\/(.*)$`);
}

/**
 * Processes an export path by removing specified prefixes
 * @param modulePath - Path to process
 * @param regexPattern - Regex for prefix removal
 * @returns Processed path starting with ./
 */
function processExportPath(modulePath: string, regexPattern: RegExp): string {
  let processedPath = modulePath;
  const match = processedPath.match(regexPattern);

  if (match) {
    const remainingPath = match[1];

    processedPath = remainingPath.startsWith("./") ? remainingPath : `./${remainingPath}`;
  }

  return processedPath;
}

/**
 * Analyzes imports from an index.ts file
 * @param indexFilePath - Path to index.ts
 * @param packageConfig - Package configuration
 * @returns AnalysisResult containing import paths
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

    let directory;

    if (parts.length <= 1) {
      directory = ".";
    } else {
      directory = parts.slice(0, -1).join("/");

      if (directory.startsWith("./")) {
        directory = directory.slice(2);
      }
    }

    const name = parts.at(-1) ?? "";

    const importPath: ImportPath = {
      originalPath: moduleSpecifier,
      directory,
      name,
      exportPath: processExportPath(moduleSpecifier, regexPattern),
    };

    imports.push(importPath);
  }

  return { imports };
}
