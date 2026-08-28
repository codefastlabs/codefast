/** The tokens the composition root owns — inspection handles for the subscribers and the top-level controller. */

import { token } from "@codefast/di";

import type { AuditLogHandler } from "#/examples/20-explicit-architecture/infrastructure/audit-log-handler";
import type { ComplianceLogHandler } from "#/examples/20-explicit-architecture/infrastructure/compliance-log-handler";
import type { FraudEngineHandler } from "#/examples/20-explicit-architecture/infrastructure/fraud-engine-handler";
import type { MetricsHandler } from "#/examples/20-explicit-architecture/infrastructure/metrics-handler";
import type { BankingController } from "#/examples/20-explicit-architecture/primary/banking-controller";

/** The audit-trail subscriber, addressable on its own for inspection. */
export const AuditLogToken = token<AuditLogHandler>("AuditLogHandler");

/** The metrics subscriber, addressable on its own for inspection. */
export const MetricsToken = token<MetricsHandler>("MetricsHandler");

/** The fraud-review subscriber, addressable on its own for inspection. */
export const FraudEngineToken = token<FraudEngineHandler>("FraudEngineHandler");

/** The compliance-ledger subscriber, addressable on its own for inspection. */
export const ComplianceToken = token<ComplianceLogHandler>("ComplianceLogHandler");

/** The primary controller that drives the inbound ports. */
export const BankingControllerToken = token<BankingController>("BankingController");
