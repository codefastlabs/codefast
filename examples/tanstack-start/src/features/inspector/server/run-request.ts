/**
 * One tenant request, run through a per-request child container, with every slot decision recorded.
 */
import type { Container } from "@codefast/di";
import { Container as DiContainer, DiError, token } from "@codefast/di";
import { createServerFn } from "@tanstack/react-start";

import type { BootReport } from "#/features/inspector/server/boot";
import { bindPricingConfig, warmAndReport } from "#/features/inspector/server/boot";
import type { CatalogEntry } from "#/features/inspector/server/catalog";
import {
  auditLoggerToken,
  notifierToken,
  paymentToken,
  registerCatalog,
  settlementToken,
  storageToken,
  tenantContextToken,
} from "#/features/inspector/server/catalog";
import type { Decision, NestedObservation } from "#/features/inspector/server/explain";
import { explainSlot } from "#/features/inspector/server/explain";
import { loadFeatureModules, riskCheckToken } from "#/features/inspector/server/feature-modules";
import type { Region, TenantContext, Tier } from "#/features/inspector/shared/tenant";
import { paymentRequest, REGIONS, storageRequest, TIERS } from "#/features/inspector/shared/tenant";

export interface RequestInput {
  readonly region: Region;
  readonly tier: Tier;
  readonly tenant: string;
  /** Buys the fraud-screening module for this request; its binding does not exist otherwise. */
  readonly fraudScreening: boolean;
  /** Deliberately wires a singleton onto a request-scoped service, so `validate()` has something to find. */
  readonly introduceCaptive: boolean;
}

interface ScopeProof {
  readonly requestId: string;
  readonly clockStartedAt: string;
  /** Two resolves inside one request: a scoped service is one instance, a transient is not. */
  readonly scopedSame: boolean;
  readonly transientSame: boolean;
}

interface ModuleReport {
  readonly loaded: ReadonlyArray<string>;
  /** What the flagged capability answered, or why it was not there to answer. */
  readonly riskCheck: string;
}

interface ValidationReport {
  readonly passed: boolean;
  readonly detail: string;
}

export interface RequestOutcome {
  readonly context: TenantContext;
  readonly decisions: ReadonlyArray<Decision>;
  readonly scope: ScopeProof;
  readonly boot: BootReport;
  readonly modules: ModuleReport;
  readonly validation: ValidationReport;
  /** Absent when every slot answered; set when the container refused one. */
  readonly blockedOn?: string;
  readonly summary: ReadonlyArray<{ readonly label: string; readonly value: string }>;
}

const clockToken = token<{ startedAt: string }>("Clock");
const requestIdToken = token<string>("RequestId");
const scopedProbeToken = token<{ id: string }>("ScopedProbe");
const transientProbeToken = token<{ id: string }>("TransientProbe");
const captiveHolderToken = token<{ heldId: string }>("CaptiveHolder");

let sequence = 0;
const nextId = (): string => {
  sequence += 1;

  return `r${String(sequence).padStart(4, "0")}`;
};

interface Root {
  readonly container: Container;
  readonly entries: ReadonlyArray<CatalogEntry>;
  readonly boot: BootReport;
}

function bindInfrastructure(container: Container): void {
  container.bind(clockToken).toConstantValue({ startedAt: new Date().toISOString() });
  container
    .bind(scopedProbeToken)
    .toDynamic(() => ({ id: nextId() }))
    .scoped();
  container
    .bind(transientProbeToken)
    .toDynamic(() => ({ id: nextId() }))
    .transient();
  bindPricingConfig(container);
}

/** The application container: built and warmed once, holding everything a request selects from. */
async function buildRoot(): Promise<Root> {
  const container = DiContainer.create();

  bindInfrastructure(container);

  const entries = registerCatalog(container);
  // Identical bindings, never warmed — the control the boot report compares against.
  const cold = DiContainer.create();

  bindPricingConfig(cold);

  return { container, entries, boot: await warmAndReport(container, cold) };
}

let rootPromise: Promise<Root> | undefined;
const getRoot = (): Promise<Root> => (rootPromise ??= buildRoot());

/** Wires the captive dependency `validate()` is meant to catch: a singleton holding a scoped service. */
function introduceCaptiveDependency(request: Container): void {
  request
    .bind(captiveHolderToken)
    .toResolved((probe: { id: string }) => ({ heldId: probe.id }), [scopedProbeToken])
    .singleton();
}

/** The logger `Settlement` was handed, or the error that stopped it from being handed one. */
function observeSettlementAudit(request: Container): NestedObservation {
  try {
    return { via: "Settlement", observed: request.resolve(settlementToken).audit };
  } catch (caught) {
    return {
      via: "Settlement",
      observed: undefined,
      error: {
        name: caught instanceof DiError ? caught.constructor.name : "Error",
        message: caught instanceof Error ? caught.message : String(caught),
      },
    };
  }
}

function validationReport(request: Container): ValidationReport {
  try {
    request.validate();

    return { passed: true, detail: "every binding's dependencies outlive it" };
  } catch (caught) {
    return {
      passed: false,
      detail: caught instanceof DiError ? `${caught.constructor.name}: ${caught.message}` : String(caught),
    };
  }
}

async function runRequest(input: RequestInput): Promise<RequestOutcome> {
  const root = await getRoot();
  const context: TenantContext = { tenant: input.tenant, region: input.region, tier: input.tier };
  // A child per request: scoped bindings live and die with it, the catalog stays on the parent.
  const request = root.container.createChild();

  request.bind(requestIdToken).toConstantValue(nextId());
  // The tenant is a binding, so Settlement can read it instead of being handed it.
  request.bind(tenantContextToken).toConstantValue(context);

  const loaded = loadFeatureModules(request, input.fraudScreening);

  if (input.introduceCaptive) {
    introduceCaptiveDependency(request);
  }

  const candidatesFor = (tokenName: string): Array<CatalogEntry> =>
    root.entries.filter((entry) => entry.tokenName === tokenName);
  const decisions: Array<Decision> = [
    explainSlot(request, storageToken, "Storage", storageRequest(context), candidatesFor("Storage")),
    explainSlot(request, paymentToken, "PaymentGateway", paymentRequest(context), candidatesFor("PaymentGateway")),
    explainSlot(request, notifierToken, "Notifier", { name: "transactional", tags: [] }, candidatesFor("Notifier")),
    explainSlot(request, auditLoggerToken, "AuditLogger", { tags: [] }, candidatesFor("AuditLogger")),
  ];

  // Resolving Settlement fills the logger slot from inside it, which is the only way the guard sees a
  // parent frame at all. Observing the result is how the nested decision learns which one won.
  const settlementAudit = observeSettlementAudit(request);

  decisions.push(
    explainSlot(request, auditLoggerToken, "AuditLogger", { tags: [] }, candidatesFor("AuditLogger"), settlementAudit),
  );

  const risk = request.resolveOptional(riskCheckToken);
  const scope: ScopeProof = {
    requestId: request.resolve(requestIdToken),
    clockStartedAt: request.resolve(clockToken).startedAt,
    scopedSame: request.resolve(scopedProbeToken) === request.resolve(scopedProbeToken),
    transientSame: request.resolve(transientProbeToken) === request.resolve(transientProbeToken),
  };
  const validation = validationReport(request);
  const blocked = decisions.find((decision) => decision.error !== undefined);

  return {
    context,
    decisions,
    scope,
    boot: root.boot,
    modules: {
      loaded,
      riskCheck:
        risk === undefined ? "no binding — the module is not loaded" : `${risk.provider} · max score ${risk.maxScore}`,
    },
    validation,
    ...(blocked === undefined ? {} : { blockedOn: blocked.token }),
    summary: [
      { label: "Data residency", value: decisions[0]?.winner ?? "—" },
      { label: "Settlement", value: decisions[1]?.winner ?? "not selectable" },
      { label: "Audit sink", value: decisions[3]?.winner ?? "—" },
    ],
  };
}

export const runRequestServerFn = createServerFn({ method: "POST" })
  .validator((input: RequestInput): RequestInput => ({
    tenant: String(input.tenant).slice(0, 40),
    region: REGIONS.includes(input.region) ? input.region : "eu",
    tier: TIERS.includes(input.tier) ? input.tier : "free",
    fraudScreening: input.fraudScreening === true,
    introduceCaptive: input.introduceCaptive === true,
  }))
  .handler(async ({ data }): Promise<RequestOutcome> => runRequest(data));
