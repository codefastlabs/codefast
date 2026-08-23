/**
 * The build output directory the mirror scan reads.
 *
 * @since 0.3.16-canary.0
 */
export const DIST_DIR = "dist";
/**
 * The manifest file name the mirror rewrites.
 *
 * @since 0.3.16-canary.0
 */
export const PACKAGE_JSON = "package.json";

/**
 * The JavaScript extensions accepted as runtime entries in `dist/`.
 *
 * @since 0.3.16-canary.0
 */
export const VALID_JS_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
/**
 * The declaration-file extensions accepted as type entries in `dist/`.
 *
 * @since 0.3.16-canary.0
 */
export const VALID_DTS_EXTENSIONS = new Set([".d.ts", ".d.mts", ".d.cts"]);
/**
 * The `package.json` self-export specifier every generated map includes.
 *
 * @since 0.3.16-canary.0
 */
export const PACKAGE_JSON_EXPORT = "./package.json";
