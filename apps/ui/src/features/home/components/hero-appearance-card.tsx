import { SwatchBookIcon } from "lucide-react";

import { AppearanceSelector } from "#/components/layout/appearance-selector";

/** Floating hero card with a live appearance picker — flips the whole site's theme. */
export function HeroAppearanceCard() {
  return (
    <div className="rounded-2xl border border-ui-border/60 bg-ui-card p-4 shadow-xl shadow-black/10 dark:shadow-black/40">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ui-fg">Make it yours</p>
        <SwatchBookIcon aria-hidden className="size-4 text-ui-muted" />
      </div>
      <AppearanceSelector />
      <p className="mt-2.5 text-xs text-ui-muted">Not a mockup — it flips the whole site.</p>
    </div>
  );
}
