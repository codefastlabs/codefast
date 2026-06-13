import { Badge } from "@codefast/ui/badge";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { GroupSection } from "#/components/showcase/group-section";
import { ALPHABET_GROUPS, ALPHABET_NAV_IDS } from "#/components/showcase/groups";
import { MobileNav } from "#/components/showcase/mobile-nav";
import { SidebarNav } from "#/components/showcase/sidebar-nav";
import { useActiveSection } from "#/components/showcase/use-active-section";
import { COMPONENTS } from "#/registry/components";

/* -------------------------------------------------------------------------- */
/* Route                                                                       */
/* -------------------------------------------------------------------------- */

export const Route = createFileRoute("/components/")({
  head: () => ({
    meta: [
      { title: "Components — codefast/ui" },
      {
        name: "description",
        content:
          "Browse the full @codefast/ui component library, A–Z — live previews and copy-ready source for every component.",
      },
    ],
  }),
  component: ComponentsPage,
});

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

function ComponentsPage() {
  const activeSection = useActiveSection(ALPHABET_NAV_IDS);
  const hash = useLocation({ select: (location) => location.hash });

  // Scroll to the targeted letter band after a mobile jump. A single rAF defers
  // the scroll until after layout has committed, so it lands on the right
  // element and wins over scroll restoration; scroll-margin on the targets
  // handles the sticky header + nav offset.
  useEffect(() => {
    if (!hash) {
      return;
    }

    const id = hash.replace(/^#/, "");
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [hash]);

  return (
    <main className="container mx-auto px-4 pt-16 pb-32">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="mb-12 max-w-2xl animate-in duration-800 ease-out fill-mode-both fade-in slide-in-from-bottom-4">
        <Badge variant="outline" className="mb-5 border-ui-border text-ui-muted">
          Components
        </Badge>
        <h1 className="mb-5 text-5xl leading-none font-bold tracking-tighter text-ui-fg md:text-6xl">
          {COMPONENTS.length}+ ready-to-use <span className="text-ui-brand">components.</span>
        </h1>
        <p className="text-base leading-relaxed text-ui-muted">
          Built on Radix UI primitives with Tailwind CSS v4. Each component ships as a named sub-path import — no barrel
          files, no tree-shaking surprises, no config required.
        </p>
      </section>

      {/* ── Mobile: compact jump nav (sidebar is hidden below lg) ─────── */}
      <MobileNav groups={ALPHABET_GROUPS} activeSection={activeSection} />

      {/* ── Two-column docs layout: sticky sidebar + card grid ────────── */}
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <SidebarNav groups={ALPHABET_GROUPS} />

        <div className="min-w-0">
          {ALPHABET_GROUPS.map((group) => (
            <GroupSection key={group.id} group={group} />
          ))}
        </div>
      </div>
    </main>
  );
}
