/**
 * Capability that ships as a module, loaded per request when the tenant has the flag on.
 *
 * @remarks A module is the unit that arrives and leaves together: loading it puts a candidate into
 * the container, unloading takes it back out, and nothing else in the pipeline has to know.
 */
import type { Container } from "@codefast/di";
import { Module, token } from "@codefast/di";

export interface RiskCheck {
  readonly provider: string;
  readonly maxScore: number;
}

export const riskCheckToken = token<RiskCheck>("RiskCheck");

/** Fraud screening: bought separately, so the binding only exists while the flag is on. */
export const fraudScreeningModule = Module.create("fraud-screening", (builder) => {
  builder.bind(riskCheckToken).toConstantValue({ provider: "Sift", maxScore: 92 });
});

/** Loads the flagged modules onto one request's container, returning what it added. */
export function loadFeatureModules(request: Container, fraudScreening: boolean): Array<string> {
  if (!fraudScreening) {
    return [];
  }

  request.load(fraudScreeningModule);

  return ["fraud-screening"];
}
