/**
 * The `@codefast/cli` public API: run the CLI in-process, and author a typed `codefast.config.*`.
 */

export { runCli } from "#cli";
export { defineConfig } from "#core/config/define-config";
export type {
  AfterWriteHook,
  AuditConfig,
  AuditSection,
  CodefastConfig,
  ExportsConfig,
  SinceConfig,
} from "#core/config/schema";
