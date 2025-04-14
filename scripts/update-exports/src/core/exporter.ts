import type { ScriptConfig } from "@/types/config";
import type { PackageExports } from "@/types/exports";
import type { ImportPath } from "@/types/imports";

import { getPackageConfig } from "@/config";

/**
 * Tạo cấu trúc exports cho package.json
 */
export function generateExports(
  packageName: string,
  imports: ImportPath[],
  existingExports: any = {},
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
    const esmOutput = packageConfig.esmOutputPattern.replace("{dir}", directory).replace("{name}", name);

    const cjsOutput = packageConfig.cjsOutputPattern.replace("{dir}", directory).replace("{name}", name);

    const typesOutput = packageConfig.typesOutputPattern.replace("{dir}", directory).replace("{name}", name);

    const typesCjsOutput = packageConfig.typesOutputCjsPattern.replace("{dir}", directory).replace("{name}", name);

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
