import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DecisionCard } from "#/features/inspector/components/decision-card";
import { OutcomeSummary } from "#/features/inspector/components/outcome-summary";
import { RequestConsole } from "#/features/inspector/components/request-console";
import { RuntimeHealthCard } from "#/features/inspector/components/runtime-health-card";
import type { Region, Tier } from "#/features/inspector/server/catalog";
import type { RequestOutcome } from "#/features/inspector/server/run-request";
import { runRequestServerFn } from "#/features/inspector/server/run-request";

export const Route = createFileRoute("/inspector")({
  // The first outcome is resolved on the server so the page has a trace before any interaction.
  loader: () =>
    runRequestServerFn({
      data: { tenant: "acme-gmbh", region: "eu", tier: "enterprise", fraudScreening: true, introduceCaptive: false },
    }),
  component: InspectorPage,
});

function InspectorPage() {
  const initial = Route.useLoaderData();
  const [outcome, setOutcome] = useState<RequestOutcome>(initial);
  const [tenant, setTenant] = useState(initial.context.tenant);
  const [region, setRegion] = useState<Region>(initial.context.region);
  const [tier, setTier] = useState<Tier>(initial.context.tier);
  const [fraudScreening, setFraudScreening] = useState(true);
  const [introduceCaptive, setIntroduceCaptive] = useState(false);
  const [pending, setPending] = useState(false);

  const send = (): void => {
    setPending(true);
    void runRequestServerFn({ data: { tenant, region, tier, fraudScreening, introduceCaptive } })
      .then(setOutcome)
      .catch(() => {
        // A transport failure is not a resolution failure; the console just stops spinning.
      })
      .finally(() => {
        setPending(false);
      });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Resolution inspector</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          A multi-region SaaS request, resolved on the server against a real container — and for every slot, the
          candidates it weighed and the rule that settled it. Residency, settlement and audit routing differ per tenant
          by law and by contract, so the container is doing the selecting rather than a pile of if-statements.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-6 lg:sticky lg:top-6">
          <RequestConsole
            fraudScreening={fraudScreening}
            introduceCaptive={introduceCaptive}
            onFraudScreeningChange={setFraudScreening}
            onIntroduceCaptiveChange={setIntroduceCaptive}
            onRegionChange={setRegion}
            onSend={send}
            onTenantChange={setTenant}
            onTierChange={setTier}
            pending={pending}
            region={region}
            tenant={tenant}
            tier={tier}
          />
          <OutcomeSummary outcome={outcome} />
          <RuntimeHealthCard outcome={outcome} />
        </div>

        <div className="space-y-4">
          {outcome.decisions.map((decision) => (
            <DecisionCard decision={decision} key={`${decision.token}:${decision.via ?? "top"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
