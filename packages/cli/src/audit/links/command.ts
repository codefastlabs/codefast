import type { Audit } from "#audit/domain/types";
import { runLinkAudit } from "#audit/links/run";

/**
 * The `audit:links` audit: markdown links that point at a missing path or an anchor the target does not offer.
 */
export const linksAudit: Audit = {
  name: "links",
  configKey: "links",
  description: "Report markdown links pointing at a missing path or an anchor the target does not offer",
  scan: runLinkAudit,
};
