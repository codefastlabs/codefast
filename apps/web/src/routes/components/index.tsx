import { useEffect } from "react";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { Badge } from "@codefast/ui/badge";
import { highlightMany } from "#/lib/highlighter.ts";
import { DEMOS } from "#/components/examples/demos";
import { GroupSection } from "#/components/showcase/components/group-section";
import { MobileNav } from "#/components/showcase/components/mobile-nav";
import { SidebarNav } from "#/components/showcase/components/sidebar-nav";
import type { HighlightedCodes, ViewMode } from "#/components/showcase/types";
import { useActiveSection } from "#/components/showcase/hooks/use-active-section";
import { ALL_COMPONENTS } from "#/data/components";
import {
  ALPHABET_GROUPS,
  CATEGORY_GROUPS,
  CATEGORY_NAV_IDS,
  LETTER_NAV_IDS,
} from "#/data/component-groups";

/* -------------------------------------------------------------------------- */
/* Route                                                                       */
/* -------------------------------------------------------------------------- */

interface ComponentsSearch {
  /** Absent → fall back to the visitor's stored preference, else "category". */
  readonly view?: ViewMode;
}

/** Parse `?view`, keeping only the two known values so links stay shareable. */
function validateSearch(search: Record<string, unknown>): ComponentsSearch {
  return search.view === "alphabetical" || search.view === "category" ? { view: search.view } : {};
}

/** localStorage key remembering a visitor's choice for bare `/components` visits. */
const VIEW_STORAGE_KEY = "components:view-mode";

export const Route = createFileRoute("/components/")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Components — codefast/ui" },
      {
        name: "description",
        content:
          "Browse the full @codefast/ui component library — live previews and copy-ready source for every component, by category or A–Z.",
      },
    ],
  }),
  // Highlight every demo's source at load time, keyed by slug.
  loader: async (): Promise<HighlightedCodes> => {
    const slugs = ALL_COMPONENTS.filter((c) => c.hasDemo).map((c) => c.slug);
    const highlighted = await highlightMany(slugs.map((slug) => DEMOS[slug]?.code ?? ""));
    const out: HighlightedCodes = {};
    slugs.forEach((slug, i) => {
      out[slug] = highlighted[i] ?? "";
    });
    return out;
  },
  staleTime: Infinity,
  component: ComponentsPage,
});

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

function ComponentsPage() {
  const hl = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  // The URL is the source of truth so a `?view=` link opens straight into that
  // layout; absent the param we fall back to "category" and let the effect below
  // upgrade to the visitor's stored preference.
  const mode: ViewMode = search.view ?? "category";
  const groups = mode === "category" ? CATEGORY_GROUPS : ALPHABET_GROUPS;

  const setMode = (next: ViewMode): void => {
    localStorage.setItem(VIEW_STORAGE_KEY, next);
    void navigate({ search: { view: next }, replace: true });
  };

  // First visit with no explicit `?view`: restore the stored preference (only
  // when it differs from the default, to keep shared/default URLs clean).
  useEffect(() => {
    if (search.view !== undefined) {
      return;
    }

    if (localStorage.getItem(VIEW_STORAGE_KEY) === "alphabetical") {
      void navigate({ search: { view: "alphabetical" }, replace: true });
    }
  }, [search.view, navigate]);

  const navIds = mode === "category" ? CATEGORY_NAV_IDS : LETTER_NAV_IDS;
  const activeSection = useActiveSection(navIds);
  const hash = useLocation({ select: (location) => location.hash });

  // Scroll to the targeted component/section after navigation. A single rAF
  // defers the scroll until after the post-navigation layout has committed, so
  // it lands on the right element and wins over scroll restoration; scroll-margin
  // on the targets handles the sticky header + nav offset.
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
          {ALL_COMPONENTS.length}+ ready-to-use <span className="text-ui-brand">components.</span>
        </h1>
        <p className="text-base leading-relaxed text-ui-muted">
          Built on Radix UI primitives with Tailwind CSS v4. Each component ships as a named
          sub-path import — no barrel files, no tree-shaking surprises, no config required.
        </p>
      </section>

      {/* ── Mobile: compact jump nav (sidebar is hidden below lg) ─────── */}
      <MobileNav groups={groups} activeSection={activeSection} mode={mode} onModeChange={setMode} />

      {/* ── Two-column docs layout: sticky sidebar + card grid ────────── */}
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <SidebarNav
          groups={groups}
          activeSection={activeSection}
          mode={mode}
          onModeChange={setMode}
        />

        <div className="min-w-0">
          {groups.map((group) => (
            <GroupSection key={group.id} group={group} hl={hl} />
          ))}
        </div>
      </div>
    </main>
  );
}
