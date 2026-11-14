import type { Audit } from "#audit/domain/types";
import { runRtlAudit } from "#audit/tailwind-rtl/run";

/**
 * The `audit:tailwind-rtl` audit: physical-direction Tailwind classes that should be logical or `rtl:`-paired.
 */
export const tailwindRtlAudit: Audit = {
  name: "tailwind-rtl",
  configKey: "tailwindRtl",
  description: "Report physical-direction Tailwind classes that should be logical or rtl:-paired",
  scan: runRtlAudit,
};
