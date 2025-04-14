import type { ScriptConfig } from "@/config/schema";

// Cấu hình mặc định
export const defaultConfig: ScriptConfig = {
  packagesGlob: "./packages/**/package.json",
  defaultPackageConfig: {
    cjsOutputPattern: "./dist/cjs/{dir}/{name}.cjs",
    esmOutputPattern: "./dist/esm/{dir}/{name}.js",
    packageJsonPath: "package.json",
    srcIndexPath: "src/index.ts",
    typesOutputCjsPattern: "./dist/types/{dir}/{name}.d.ts",
    typesOutputPattern: "./dist/types/{dir}/{name}.d.ts",
  },
  customPackageConfigs: {},
};
