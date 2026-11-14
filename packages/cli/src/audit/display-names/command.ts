import { runDisplayNameAudit } from "#audit/display-names/run";
import type { Audit } from "#audit/domain/types";

/**
 * The `audit:display-names` audit: display names that break the `<namespace>:<Name>` convention.
 */
export const displayNamesAudit: Audit = {
  name: "display-names",
  configKey: "displayNames",
  description: "Report token(), tag() and module display names that break the <namespace>:<Name> convention",
  scan: runDisplayNameAudit,
};
