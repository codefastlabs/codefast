/** The infrastructure module — binds every outbound port to a concrete adapter. */

import { Module } from "@codefast/di";

import { AccountRepositoryToken } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import { ClockToken } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import {
  EventHandlerToken,
  EventPublisherToken,
} from "#/examples/20-explicit-architecture/application/ports/events.port";
import { IdGeneratorToken } from "#/examples/20-explicit-architecture/application/ports/id-generator.port";
import { RequestContextToken } from "#/examples/20-explicit-architecture/application/ports/request-context.port";
import { AuditLogToken, MetricsToken } from "#/examples/20-explicit-architecture/composition/tokens";
import { AuditLogHandler } from "#/examples/20-explicit-architecture/infrastructure/audit-log-handler";
import { FanOutEventPublisher } from "#/examples/20-explicit-architecture/infrastructure/fan-out-event-publisher";
import { InMemoryAccountRepository } from "#/examples/20-explicit-architecture/infrastructure/in-memory-account-repository";
import { MetricsHandler } from "#/examples/20-explicit-architecture/infrastructure/metrics-handler";
import { SequentialIdGenerator } from "#/examples/20-explicit-architecture/infrastructure/sequential-id-generator";
import { SystemClock } from "#/examples/20-explicit-architecture/infrastructure/system-clock";

// Stands in for a real per-request id source; scoped caching gives each unit of work its own value.
let requestSequence = 0;

/** Binds the storage, clock, id, and eventing adapters that the domain never names directly. */
export const infrastructureModule = Module.create("Infrastructure", (builder) => {
  builder.bind(AccountRepositoryToken).to(InMemoryAccountRepository).singleton();
  builder.bind(ClockToken).to(SystemClock).singleton();
  builder.bind(IdGeneratorToken).to(SequentialIdGenerator).singleton();

  // The two subscribers are bound under their own tokens, then aliased into distinct named slots so a
  // single resolveAll(EventHandlerToken) — driven by injectAll on the publisher — reaches both instances.
  builder.bind(AuditLogToken).to(AuditLogHandler).singleton();
  builder.bind(MetricsToken).to(MetricsHandler).singleton();
  builder
    .bind(EventHandlerToken)
    .toDynamic((ctx) => ctx.resolve(AuditLogToken))
    .whenNamed("audit")
    .singleton();
  builder
    .bind(EventHandlerToken)
    .toDynamic((ctx) => ctx.resolve(MetricsToken))
    .whenNamed("metrics")
    .singleton();

  builder.bind(EventPublisherToken).to(FanOutEventPublisher).singleton();

  builder
    .bind(RequestContextToken)
    .toDynamic(() => {
      requestSequence += 1;

      return { requestId: `req-${String(requestSequence).padStart(3, "0")}` };
    })
    .scoped();
});
