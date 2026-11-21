import type { Audit } from "#audit/domain/types";
import { runImportsAudit } from "#audit/imports/run";

/**
 * The `audit:imports` audit: import forms the config's import rules ban, which oxlint cannot express.
 *
 * @since 0.16.0
 */
export const importsAudit: Audit = {
  name: "imports",
  configKey: "imports",
  description: "Report import forms the config's audit.imports.rules ban",
  scan: runImportsAudit,
};
