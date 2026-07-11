import { useAppearance } from "@codefast/theme";
import { Badge } from "@codefast/ui/badge";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Callout } from "#/components/callout";
import { DemoSection } from "#/components/demo-section";
import { AnimatedCounterCard } from "#/features/playground/components/animated-counter-card";
import { CopyField } from "#/features/playground/components/copy-field";
import { PaginatedList } from "#/features/playground/components/paginated-list";
import { ViewportBadge } from "#/features/playground/components/viewport-badge";

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
});

const PACKAGES = [
  "@codefast/ui",
  "@codefast/theme",
  "@codefast/tailwind-variants",
  "@codefast/di",
  "@codefast/tracking",
  "@codefast/cli",
  "@codefast/typescript-config",
] as const;

function PlaygroundPage() {
  const { appearance, colorScheme } = useAppearance();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Playground</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A small interactive app that wires several <code className="font-mono">@codefast</code> packages together:{" "}
          <code className="font-mono">@codefast/ui</code> hooks and components,{" "}
          <code className="font-mono">@codefast/theme</code> for the active appearance, and the{" "}
          <code className="font-mono">tv()</code>-based <code className="font-mono">Callout</code>.
        </p>
      </header>

      <Callout tone="info">
        {mounted
          ? `Active appearance: ${appearance} (resolved ${colorScheme}). The sections below react live to your input and viewport.`
          : "Resolving your appearance and viewport…"}
      </Callout>

      <DemoSection
        description="Edit the text and copy it — feedback comes from use-copy-to-clipboard's isCopied flag."
        title="Copy to clipboard"
      >
        <CopyField defaultValue="pnpm add @codefast/ui @codefast/theme" />
      </DemoSection>

      <DemoSection
        description="Resize the window: use-media-query and use-is-mobile drive these badges live."
        title="Viewport & breakpoint"
      >
        <ViewportBadge />
      </DemoSection>

      <DemoSection
        description="use-animated-value eases the number toward each target; motion respects prefers-reduced-motion."
        title="Animated counter"
      >
        <AnimatedCounterCard />
      </DemoSection>

      <DemoSection
        description="use-pagination builds the page model, including collapsed ellipsis ranges."
        title="Paginated list"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{PACKAGES.length} packages</Badge>
          </div>
          <PaginatedList items={PACKAGES} resultsPerPage={3} />
        </div>
      </DemoSection>
    </div>
  );
}
