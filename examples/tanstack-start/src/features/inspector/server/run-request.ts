/**
 * One tenant request, run through a per-request child container, with every slot decision recorded.
 */
// Side-effect import: install the Map.prototype.getOrInsert polyfill before @codefast/di loads.
import "#/features/di/server/map-get-or-insert";
import { Container, token } from "@codefast/di";
import { createServerFn } from "@tanstack/react-start";

import type { CatalogEntry, Region, TenantContext, Tier } from "#/features/inspector/server/catalog";
import {
  auditLoggerToken,
  notifierToken,
  paymentRequest,
  paymentToken,
  REGIONS,
  registerCatalog,
  storageRequest,
  storageToken,
  TIERS,
} from "#/features/inspector/server/catalog";
import type { Decision } from "#/features/inspector/server/explain";
import { explainSlot } from "#/features/inspector/server/explain";

export interface RequestInput {
  readonly region: Region;
  readonly tier: Tier;
  readonly tenant: string;
}

export interface ScopeProof {
  readonly requestId: string;
  readonly clockStartedAt: string;
  /** Two resolves inside one request: a scoped service is one instance, a transient is not. */
  readonly scopedSame: boolean;
  readonly transientSame: boolean;
}

export interface RequestOutcome {
  readonly context: TenantContext;
  readonly decisions: ReadonlyArray<Decision>;
  readonly scope: ScopeProof;
  /** Absent when every slot answered; set when the container refused one. */
  readonly blockedOn?: string;
  readonly summary: ReadonlyArray<{ readonly label: string; readonly value: string }>;
}

const clockToken = token<{ startedAt: string }>("Clock");
const requestIdToken = token<string>("RequestId");
const scopedProbeToken = token<{ id: string }>("ScopedProbe");
const transientProbeToken = token<{ id: string }>("TransientProbe");

let sequence = 0;
const nextId = (): string => {
  sequence += 1;

  return `r${String(sequence).padStart(4, "0")}`;
};

/** The application container: built once, holding everything a request selects from. */
function buildRootContainer(): { container: Container; entries: Array<CatalogEntry> } {
  const container = Container.create();

  container.bind(clockToken).toConstantValue({ startedAt: new Date().toISOString() });
  container
    .bind(scopedProbeToken)
    .toDynamic(() => ({ id: nextId() }))
    .scoped();
  container
    .bind(transientProbeToken)
    .toDynamic(() => ({ id: nextId() }))
    .transient();

  return { container, entries: registerCatalog(container) };
}

const root = buildRootContainer();

export function runRequest(input: RequestInput): RequestOutcome {
  const context: TenantContext = { tenant: input.tenant, region: input.region, tier: input.tier };
  // A child per request: scoped bindings live and die with it, the catalog stays on the parent.
  const request = root.container.createChild();

  request.bind(requestIdToken).toConstantValue(nextId());

  const candidatesFor = (tokenName: string): Array<CatalogEntry> =>
    root.entries.filter((entry) => entry.tokenName === tokenName);
  const decisions: Array<Decision> = [
    explainSlot(request, storageToken, "Storage", storageRequest(context), candidatesFor("Storage")),
    explainSlot(request, paymentToken, "PaymentGateway", paymentRequest(context), candidatesFor("PaymentGateway")),
    explainSlot(request, notifierToken, "Notifier", { name: "transactional", tags: [] }, candidatesFor("Notifier")),
    explainSlot(request, auditLoggerToken, "AuditLogger", { tags: [] }, candidatesFor("AuditLogger")),
  ];

  const scope: ScopeProof = {
    requestId: request.resolve(requestIdToken),
    clockStartedAt: request.resolve(clockToken).startedAt,
    scopedSame: request.resolve(scopedProbeToken) === request.resolve(scopedProbeToken),
    transientSame: request.resolve(transientProbeToken) === request.resolve(transientProbeToken),
  };

  const blocked = decisions.find((decision) => decision.error !== undefined);
  const storage = decisions[0]?.winner;
  const payment = decisions[1]?.winner;

  return {
    context,
    decisions,
    scope,
    ...(blocked === undefined ? {} : { blockedOn: blocked.token }),
    summary: [
      { label: "Data residency", value: storage ?? "—" },
      { label: "Settlement", value: payment ?? "not selectable" },
      { label: "Audit sink", value: decisions[3]?.winner ?? "—" },
    ],
  };
}

export const runRequestServerFn = createServerFn({ method: "POST" })
  .validator(
    (input: RequestInput): RequestInput => ({
      tenant: String(input.tenant).slice(0, 40),
      region: REGIONS.includes(input.region) ? input.region : "eu",
      tier: TIERS.includes(input.tier) ? input.tier : "free",
    }),
  )
  .handler(({ data }): RequestOutcome => runRequest(data));
