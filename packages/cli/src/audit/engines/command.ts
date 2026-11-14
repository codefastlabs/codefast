import type { Audit } from "#audit/domain/types";
import type { EnginesScan } from "#audit/engines/run";
import { runEnginesAudit } from "#audit/engines/run";

/**
 * The `audit:engines` audit: each package's Node floor against every dependency's `engines.node`.
 */
export const enginesAudit: Audit<EnginesScan> = {
  name: "engines",
  configKey: "engines",
  description:
    "Report Node floors (engines.node) that are missing, malformed, outside a dependency's engines, or off their @types/node line",
  scan: runEnginesAudit,
};
