import { Button } from "@codefast/ui/button";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PackageCard } from "#/components/package-card";

export const Route = createFileRoute("/")({
  component: OverviewPage,
});

const VERSION = "0.4.0";

function OverviewPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Installed from npm · {VERSION}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          The <span className="font-mono">@codefast/*</span> packages, running from their published npm builds
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          This TanStack Start app depends on <code className="font-mono">@codefast/ui</code>,{" "}
          <code className="font-mono">@codefast/theme</code>,{" "}
          <code className="font-mono">@codefast/tailwind-variants</code> and{" "}
          <code className="font-mono">@codefast/di</code> with real registry version ranges — not{" "}
          <code className="font-mono">workspace:*</code> links. Everything below therefore exercises the actual shipped{" "}
          <code className="font-mono">dist/</code>, the same bytes an external consumer would install.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <PackageCard
          description="Radix-based, Tailwind CSS v4 component library with per-component subpath exports."
          name="@codefast/ui"
          version={VERSION}
        >
          <Button asChild size="sm" variant="outline">
            <Link to="/ui">Open UI showcase</Link>
          </Button>
        </PackageCard>

        <PackageCard
          description="React 19 color-scheme management with SSR-safe resolution and cross-tab sync."
          name="@codefast/theme"
          version={VERSION}
        >
          <Button asChild size="sm" variant="outline">
            <Link to="/ui">Try the toggle ↗</Link>
          </Button>
        </PackageCard>

        <PackageCard
          description="Type-safe variant styling API — a faster tailwind-variants replacement."
          name="@codefast/tailwind-variants"
          version={VERSION}
        >
          <Button asChild size="sm" variant="outline">
            <Link to="/variants">Open variants demo</Link>
          </Button>
        </PackageCard>

        <PackageCard
          description="Lightweight dependency-injection primitives — used here as a server-side composition root."
          name="@codefast/di"
          version={VERSION}
        >
          <Button asChild size="sm" variant="outline">
            <Link to="/di">Open fullstack DI demo</Link>
          </Button>
        </PackageCard>
      </div>
    </div>
  );
}
