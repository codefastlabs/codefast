import type { ScriptConfig } from "@/types/config";

// Cấu hình mặc định
export const defaultConfig: ScriptConfig = {
  packagesGlob: "./packages/**/package.json",
  defaultPackageConfig: {
    srcIndexPath: "src/index.ts",
    packageJsonPath: "package.json",
    esmOutputPattern: "./dist/esm/{dir}/{name}.js",
    cjsOutputPattern: "./dist/cjs/{dir}/{name}.cjs",
    typesOutputPattern: "./dist/types/{dir}/{name}.d.ts",
    typesOutputCjsPattern: "./dist/types/{dir}/{name}.d.ts",
  },
  customPackageConfigs: {},
};
