import type { Audit } from "#audit/domain/types";
import { runLayersAudit } from "#audit/layers/run";

/**
 * The `audit:layers` audit: value imports that point up a package's configured layers.
 *
 * @since 0.16.0
 */
export const layersAudit: Audit = {
  name: "layers",
  configKey: "layers",
  description: "Report value imports that point up a package's configured layers, and modules sitting in no layer",
  scan: runLayersAudit,
};
