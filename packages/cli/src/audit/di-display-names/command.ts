import { runDisplayNameAudit } from "#audit/di-display-names/run";
import type { Audit } from "#audit/domain/types";

/**
 * The `audit:di-display-names` audit: `@codefast/di` display names that break the `<namespace>:<Name>` convention.
 */
export const diDisplayNamesAudit: Audit = {
  name: "di-display-names",
  configKey: "diDisplayNames",
  description:
    "Report @codefast/di token(), tag() and module display names that break the <namespace>:<Name> convention",
  scan: runDisplayNameAudit,
};
