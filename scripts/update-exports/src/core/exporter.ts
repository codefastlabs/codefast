import type { ScriptConfig } from "@/config/schema";
import type { PackageExports } from "@/types/exports";
import type { ImportPath } from "@/types/imports";

import { getPackageConfig } from "@/config";

function formatOutputPath(pattern: string, directory: string, name: string): string {
  const dirPart = directory === "." ? "" : `${directory}/`;

  return pattern.replace("{dir}/", dirPart).replace("{dir}", directory).replace("{name}", name);
}

/**
 * Tạo cấu trúc exports cho package.json
 */
export function generateExports(
  packageName: string,
  imports: ImportPath[],
  existingExports: PackageExports = {},
  config?: ScriptConfig,
): PackageExports {
  const packageConfig = getPackageConfig(packageName, config);

  // Sao chép cấu trúc exports hiện tại
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

  // CSS exports (giữ nguyên nếu đã tồn tại)
  if (existingExports["./styles.css"]) {
    exports["./styles.css"] = existingExports["./styles.css"];
  }

  // Thêm exports cho từng import path
  for (const importPath of imports) {
    const { directory, name, exportPath } = importPath;

    // Tạo đường dẫn output dựa theo cấu hình package
    const esmOutput = formatOutputPath(packageConfig.esmOutputPattern, directory, name);
    const cjsOutput = formatOutputPath(packageConfig.cjsOutputPattern, directory, name);
    const typesOutput = formatOutputPath(packageConfig.typesOutputPattern, directory, name);
    const typesCjsOutput = formatOutputPath(packageConfig.typesOutputCjsPattern, directory, name);

    // Thêm vào exports
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
