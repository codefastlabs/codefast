import type { Audit } from "#audit/domain/types";
import { runSinceVersionsAudit } from "#audit/since-versions/run";

/**
 * The `audit:since-versions` audit: `@since` tags naming no version, or one newer than their package's own.
 */
export const sinceVersionsAudit: Audit = {
  name: "since-versions",
  configKey: "sinceVersions",
  description: "Report @since tags that name no version, or a version newer than their package's own",
  scan: runSinceVersionsAudit,
};
