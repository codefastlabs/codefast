import { createFileRoute } from "@tanstack/react-router";

import { Callout } from "#/components/callout";
import { DemoSection } from "#/components/demo-section";

export const Route = createFileRoute("/variants")({
  component: VariantsPage,
});

const TONES = ["info", "success", "warning", "danger"] as const;

function VariantsPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">@codefast/tailwind-variants</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The <code className="font-mono">Callout</code> component below is built with a single{" "}
          <code className="font-mono">tv()</code> config. The <code className="font-mono">tone</code> and{" "}
          <code className="font-mono">emphasis</code> props — and their types — are derived from that config via{" "}
          <code className="font-mono">VariantProps</code>.
        </p>
      </header>

      <DemoSection description="One tv() config, four typed tones." title="tone">
        <div className="grid gap-3 sm:grid-cols-2">
          {TONES.map((tone) => (
            <Callout key={tone} tone={tone}>
              <span className="font-mono">tone=&quot;{tone}&quot;</span>
            </Callout>
          ))}
        </div>
      </DemoSection>

      <DemoSection description="A second variant axis composes with the first." title="emphasis">
        <div className="grid gap-3 sm:grid-cols-2">
          <Callout emphasis="subtle" tone="success">
            <span className="font-mono">emphasis=&quot;subtle&quot;</span>
          </Callout>
          <Callout emphasis="strong" tone="success">
            <span className="font-mono">emphasis=&quot;strong&quot;</span>
          </Callout>
        </div>
      </DemoSection>
    </div>
  );
}
