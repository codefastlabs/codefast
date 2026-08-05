/** The bindings a multi-region SaaS request selects from, plus a descriptor per binding for the trace. */
import type { BindingIdentifier, Container } from "@codefast/di";
import { token, whenParentIs } from "@codefast/di";

import type { Region, SlotTags, TenantContext } from "#/features/inspector/shared/tenant";
import { paymentRequest, REGIONS } from "#/features/inspector/shared/tenant";

export interface Storage {
  readonly adapter: string;
  readonly residency: string;
}

export interface PaymentGateway {
  readonly gateway: string;
  readonly feePercent: number;
}

export interface Notifier {
  readonly channel: string;
}

export interface AuditLogger {
  readonly sink: string;
}

/** The service that actually settles a payment, and therefore the one that needs an audit trail. */
export interface Settlement {
  readonly gateway: string;
  readonly feePercent: number;
  readonly audit: AuditLogger;
}

export const storageToken = token<Storage>("Storage");
export const paymentToken = token<PaymentGateway>("PaymentGateway");
export const notifierToken = token<Notifier>("Notifier");
export const auditLoggerToken = token<AuditLogger>("AuditLogger");
export const settlementToken = token<Settlement>("Settlement");
export const tenantContextToken = token<TenantContext>("TenantContext");

/** What the trace needs about one registered binding, including what the snapshot cannot tell it. */
export interface CatalogEntry {
  readonly id: BindingIdentifier;
  /** Which token this binding serves, so a trace can gather one slot's candidates exactly. */
  readonly tokenName: string;
  readonly label: string;
  readonly slot: { readonly name?: string; readonly tags: SlotTags };
  /** Present when a `when()` predicate guards the binding, which no snapshot reports. */
  readonly guard?: string;
  /** Server-side only: used to identify which entry a real resolve returned. */
  readonly value: unknown;
}

const RESIDENCY: Record<Region, string> = {
  eu: "Frankfurt · GDPR",
  us: "us-east-1 · SOC 2",
  apac: "Singapore · PDPA",
};

const GATEWAY: Record<Region, string> = { eu: "Adyen", us: "Stripe", apac: "Stripe" };

/** Negotiated rates exist for the two regions where enterprise contracts are sold. */
const NEGOTIATED: ReadonlyArray<{ region: Region; gateway: string; feePercent: number }> = [
  { region: "eu", gateway: "Adyen · negotiated", feePercent: 1.4 },
  { region: "us", gateway: "Stripe · negotiated", feePercent: 1.6 },
];

/** Registers everything a request can select from, returning one descriptor per binding. */
export function registerCatalog(container: Container): Array<CatalogEntry> {
  const entries: Array<CatalogEntry> = [];

  for (const region of REGIONS) {
    const storage: Storage = { adapter: `S3Adapter(${region})`, residency: RESIDENCY[region] };
    const storageBinding = container.bind(storageToken).toConstantValue(storage).whenTagged("region", region);

    entries.push({
      id: storageBinding.id(),
      tokenName: "Storage",
      label: storage.adapter,
      slot: { tags: [["region", region]] },
      value: storage,
    });

    const payment: PaymentGateway = { gateway: GATEWAY[region], feePercent: 2.9 };
    const paymentBinding = container.bind(paymentToken).toConstantValue(payment).whenTagged("region", region);

    entries.push({
      id: paymentBinding.id(),
      tokenName: "PaymentGateway",
      label: `${payment.gateway} (list rate)`,
      slot: { tags: [["region", region]] },
      value: payment,
    });
  }

  // An enterprise contract is a *specialisation* of a region, not a second axis: it declares both
  // tags, so a request naming both takes it while everyone else keeps the regional list rate.
  for (const { region, gateway, feePercent } of NEGOTIATED) {
    const negotiated: PaymentGateway = { gateway, feePercent };
    const binding = container
      .bind(paymentToken)
      .toConstantValue(negotiated)
      .whenTagged("region", region)
      .whenTagged("tier", "enterprise");

    entries.push({
      id: binding.id(),
      tokenName: "PaymentGateway",
      label: gateway,
      slot: {
        tags: [
          ["region", region],
          ["tier", "enterprise"],
        ],
      },
      value: negotiated,
    });
  }

  // A global enterprise promo, tagged on tier alone. In eu and us the negotiated binding declares
  // two tags and outranks it; in apac, where no contract exists, both carry one tag and the
  // container has nothing to separate them — the one combination that genuinely cannot be answered.
  const promo: PaymentGateway = { gateway: "Promo rate (global)", feePercent: 1.9 };
  const promoBinding = container.bind(paymentToken).toConstantValue(promo).whenTagged("tier", "enterprise");

  entries.push({
    id: promoBinding.id(),
    tokenName: "PaymentGateway",
    label: promo.gateway,
    slot: { tags: [["tier", "enterprise"]] },
    value: promo,
  });

  for (const [name, channel] of [
    ["transactional", "email"],
    ["system", "webhook"],
  ] as const) {
    const notifier: Notifier = { channel };
    const binding = container.bind(notifierToken).toConstantValue(notifier).whenNamed(name);

    entries.push({
      id: binding.id(),
      tokenName: "Notifier",
      label: `${channel} notifier`,
      slot: { name, tags: [] },
      value: notifier,
    });
  }

  // Whoever the logger is resolved *for* decides where it writes — the reason contextual constraints
  // exist, rather than threading a sink parameter through every stage.
  const appLog: AuditLogger = { sink: "app.log" };
  const appLogBinding = container.bind(auditLoggerToken).toConstantValue(appLog);

  entries.push({
    id: appLogBinding.id(),
    tokenName: "AuditLogger",
    label: appLog.sink,
    slot: { tags: [] },
    value: appLog,
  });

  const paymentsLog: AuditLogger = { sink: "payments.audit · retained 7y" };
  const paymentsLogBinding = container
    .bind(auditLoggerToken)
    .toConstantValue(paymentsLog)
    .when(whenParentIs(settlementToken));

  entries.push({
    id: paymentsLogBinding.id(),
    tokenName: "AuditLogger",
    label: paymentsLog.sink,
    slot: { tags: [] },
    guard: "when the parent is Settlement",
    value: paymentsLog,
  });

  // Settlement is what makes the audit guard reachable: the logger is resolved *inside* this
  // binding, so the frame above it is Settlement rather than nothing.
  container.bind(settlementToken).toDynamic((ctx) => {
    const context = ctx.resolve(tenantContextToken);
    const gateway = ctx.resolve(paymentToken, paymentRequest(context));

    return { ...gateway, audit: ctx.resolve(auditLoggerToken) };
  });

  return entries;
}
