import type { Audit } from "#audit/domain/types";
import { runPublishAudit } from "#audit/publish/run";

/**
 * The `audit:publish` audit: what would break a consumer's install of a published package.
 */
export const publishAudit: Audit = {
  name: "publish",
  configKey: "publish",
  description:
    "Report what breaks a consumer's install: #/ imports, unshipped exports/imports targets, and stylesheet @source paths reaching nothing shipped",
  scan: runPublishAudit,
};
