import { runAssertionAudit } from "#audit/assertions/run";
import type { Audit } from "#audit/domain/types";

/**
 * The `audit:assertions` audit: double type assertions through `unknown` or `any`.
 */
export const assertionsAudit: Audit = {
  name: "assertions",
  configKey: "assertions",
  description: "Report double type assertions through unknown or any (x as unknown as T), tests included",
  scan: runAssertionAudit,
};
