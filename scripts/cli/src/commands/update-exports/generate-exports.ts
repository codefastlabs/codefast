import type { ImportPath, PackageExports, ScriptConfig } from "@/commands/update-exports/types";

import { getPackageConfig } from "@/commands/update-exports/config";

/**
 * Formats an output path based on a pattern, directory, and name
 * @param pattern - Output pattern
 * @param directory - Directory path
 * @param name - Module name
 * @returns Formatted output path
 */
function formatOutputPath(pattern: string, directory: string, name: string): string {
  const dirPart = directory === "." ? "" : `${directory}/`;

  return pattern.replace("{dir}/", dirPart).replace("{dir}", directory).replace("{name}", name);
}

/**
 * Generates export structure for package.json
 * @param packageName - Name of the package
 * @param imports - Analyzed import paths
 * @param existingExports - Current exports to preserve
 * @param config - Optional ScriptConfig
 * @returns Updated PackageExports
 */
export function generateExports(
  packageName: string,
  imports: ImportPath[],
  existingExports: PackageExports = {},
  config?: ScriptConfig,
): PackageExports {
  const packageConfig = getPackageConfig(packageName, config);

  const exports: PackageExports = {
    ".": existingExports["."] ?? {
      import: {
        types: "./dist/types/index.d.ts",
        default: "./dist/esm/index.js",
      },
      require: {
        types: "./dist/types/index.d.cts",
        default: "./dist/cjs/index.cjs",
      },
    },
  };

  // Preserve existing CSS exports
  if (existingExports["./styles.css"]) {
    exports["./styles.css"] = existingExports["./styles.css"];
  }

  // Generate exports for each import path
  for (const importPath of imports) {
    const { directory, name, exportPath } = importPath;

    const esmOutput = formatOutputPath(packageConfig.esmOutputPattern, directory, name);
    const cjsOutput = formatOutputPath(packageConfig.cjsOutputPattern, directory, name);
    const typesOutput = formatOutputPath(packageConfig.typesOutputPattern, directory, name);
    const typesCjsOutput = formatOutputPath(packageConfig.typesOutputCjsPattern, directory, name);

    exports[exportPath] = {
      import: {
        types: typesOutput,
        default: esmOutput,
      },
      require: {
        types: typesCjsOutput,
        default: cjsOutput,
      },
    };
  }

  return exports;
}
