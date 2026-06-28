import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { createFileRoute } from "@tanstack/react-router";

import { DemoSection } from "#/components/demo-section";
import { getPricedCatalogServerFn } from "#/server/pricing";

export const Route = createFileRoute("/di")({
  // The loader calls a TanStack Start server function, so the DI container is resolved on the
  // server and only the plain data crosses to the client.
  loader: () => getPricedCatalogServerFn(),
  component: DiPage,
});

function DiPage() {
  const catalog = Route.useLoaderData();
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: catalog.currency });

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">@codefast/di — fullstack</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A server function resolves a <code className="font-mono">CatalogService</code> from a DI container whose
          object graph is wired in a server-only composition root. The container, the policy and{" "}
          <code className="font-mono">@codefast/di</code> itself never reach the browser — only the priced result below
          does.
        </p>
      </header>

      <DemoSection
        description={`Resolved on the server for region ${catalog.region}. The 20% tax is applied by an injected PricingPolicy.`}
        title="Priced catalog"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plans</CardTitle>
            <CardDescription>
              Generated at <code className="font-mono text-xs">{catalog.generatedAt}</code> · reload to see the clock
              advance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Plan</th>
                  <th className="py-2 text-right font-medium">Net</th>
                  <th className="py-2 text-right font-medium">Tax</th>
                  <th className="py-2 text-right font-medium">Gross</th>
                </tr>
              </thead>
              <tbody>
                {catalog.plans.map((plan) => (
                  <tr key={plan.sku} className="border-b border-border/60 last:border-0">
                    <td className="py-2 font-medium">{plan.name}</td>
                    <td className="py-2 text-right tabular-nums">{money.format(plan.net)}</td>
                    <td className="py-2 text-right text-muted-foreground tabular-nums">{money.format(plan.tax)}</td>
                    <td className="py-2 text-right font-medium tabular-nums">{money.format(plan.gross)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </DemoSection>

      <DemoSection description="What the server-only composition root does, in order." title="How it is wired">
        <Card>
          <CardContent className="pt-6">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Declare typed <code className="font-mono">token&lt;T&gt;()</code> keys for the config, clock,
                repository, policy and service.
              </li>
              <li>
                Bind config with <code className="font-mono">toConstantValue</code>; bind the rest with{" "}
                <code className="font-mono">toDynamic</code> factories marked{" "}
                <code className="font-mono">singleton()</code>.
              </li>
              <li>
                Each factory pulls its own dependencies via <code className="font-mono">context.resolve(Token)</code> —
                no manual wiring.
              </li>
              <li>
                The server function resolves <code className="font-mono">CatalogServiceToken</code> and returns plain
                data to the loader.
              </li>
            </ol>
          </CardContent>
        </Card>
      </DemoSection>
    </div>
  );
}
