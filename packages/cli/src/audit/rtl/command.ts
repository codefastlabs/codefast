import type { Audit } from "#audit/domain/types";
import { runRtlAudit } from "#audit/rtl/run";

/**
 * The `audit:rtl` audit: physical-direction Tailwind classes that should be logical or `rtl:`-paired.
 */
export const rtlAudit: Audit = {
  name: "rtl",
  configKey: "rtl",
  description: "Report physical-direction Tailwind classes that should be logical or rtl:-paired",
  scan: runRtlAudit,
};
