import type { Audit } from "#audit/domain/types";
import { runImportsAudit } from "#audit/imports/run";

/**
 * The `audit:imports` audit: import forms the house style bans, which oxlint cannot express.
 */
export const importsAudit: Audit = {
  name: "imports",
  configKey: "imports",
  description: "Report banned import forms (React imports that are not named-only, Zod imported by name, …)",
  scan: runImportsAudit,
};
