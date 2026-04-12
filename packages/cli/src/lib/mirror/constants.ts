export const DIST_DIR = "dist";
export const PACKAGE_JSON = "package.json";

export const CODEFAST_CONFIG_JS = [
  "codefast.config.js",
  "codefast.config.mjs",
  "codefast.config.cjs",
] as const;

export const CODEFAST_CONFIG_JSON = "codefast.config.json";
export const LEGACY_CONFIG_JS = "generate-exports.config.js";
export const LEGACY_CONFIG_JSON = "generate-exports.config.json";

export const VALID_JS_EXTENSIONS = new Set([".js", ".cjs"]);
export const DTS_EXTENSION = ".d.ts";
export const PACKAGE_JSON_EXPORT = "./package.json";
