/**
 * The `@codefast/cli` public API: run the CLI in-process, and author a typed `codefast.config.*`.
 */

export { runCli } from "#cli";
export { defineConfig } from "#core/config/define-config";
export type { CodefastAfterWriteHook, CodefastConfig, SinceConfig, ExportsConfig } from "#core/config/schema";
