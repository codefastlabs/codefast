import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute, useLocation } from "@tanstack/react-router";
import { Badge } from "@codefast/ui/badge";
import { ArrowUpRightIcon } from "lucide-react";
import { highlightMany } from "#/lib/highlighter.ts";
import { LazyVisible } from "#/components/lazy-visible";
import { PreviewCard } from "#/components/preview-card";
import { DEMOS } from "#/components/examples/demos";
import type { ComponentMeta } from "#/data/components";
import { ALL_COMPONENTS, CATEGORIES, componentPath } from "#/data/components";

/* -------------------------------------------------------------------------- */
/* Route — highlight every demo's source at load time, keyed by slug          */
/* -------------------------------------------------------------------------- */

type HighlightedCodes = Record<string, string>;

/** How the component grid is organised. Mirrored to the `?view` search param. */
type ViewMode = "category" | "alphabetical";

interface ComponentsSearch {
  /** Absent → fall back to the visitor's stored preference, else "category". */
  readonly view?: ViewMode;
}

/** Parse `?view`, keeping only the two known values so links stay shareable. */
function validateSearch(search: Record<string, unknown>): ComponentsSearch {
  return search.view === "alphabetical" || search.view === "category" ? { view: search.view } : {};
}

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
/* Derived registries — computed once at module load                          */
/* -------------------------------------------------------------------------- */

/**
 * A navigable band of components: a category or an A–Z letter. The sidebar nav
 * and the content grid both iterate the same groups so counts, anchors, and
 * scroll-spy targets line up exactly. Every component appears (incl. docs-only
 * Sidebar), so the totals match the hero's "62+".
 */
interface ComponentGroup {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly items: ReadonlyArray<ComponentMeta>;
}

const CATEGORY_GROUPS: ReadonlyArray<ComponentGroup> = CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  description: category.description,
  items: ALL_COMPONENTS.filter((c) => c.category === category.id),
}));

const ALPHABET_GROUPS: ReadonlyArray<ComponentGroup> = (() => {
  const sorted = [...ALL_COMPONENTS].sort((a, b) => a.name.localeCompare(b.name));
  const buckets = new Map<string, Array<ComponentMeta>>();

  for (const component of sorted) {
    const letter = component.name.charAt(0).toUpperCase();
    const bucket = buckets.get(letter);

    if (bucket) {
      bucket.push(component);
    } else {
      buckets.set(letter, [component]);
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ id: `letter-${letter}`, label: letter, items }));
})();

/** Stable id lists per view mode so the scroll-spy effect re-binds cleanly. */
const CATEGORY_NAV_IDS = CATEGORY_GROUPS.map((g) => g.id);
const LETTER_NAV_IDS = ALPHABET_GROUPS.map((g) => g.id);

/** localStorage key remembering a visitor's choice for bare `/components` visits. */
const VIEW_STORAGE_KEY = "components:view-mode";

/* -------------------------------------------------------------------------- */
/* Scroll-spy — tracks which group is currently in view                        */
/* -------------------------------------------------------------------------- */

function useActiveSection(ids: ReadonlyArray<string>): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const id of ids) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [ids]);

  return active;
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                       */
/* -------------------------------------------------------------------------- */

/** A live-demo preview card, or a docs-only card for components without a demo. */
function ComponentCard({
  component,
  highlighted,
}: {
  component: ComponentMeta;
  highlighted: string;
}) {
  const demo = DEMOS[component.slug];

  if (!demo) {
    return (
      <div
        id={component.slug}
        className="flex scroll-mt-28 flex-col rounded-2xl border border-dashed border-ui-border bg-ui-card"
      >
        <div className="flex min-h-40 flex-1 items-center justify-center bg-ui-surface p-6">
          <span className="rounded-full border border-ui-border bg-ui-card px-3 py-1 text-xs font-medium text-ui-muted">
            No live preview
          </span>
        </div>
        <div className="border-t border-ui-border px-4 py-3">
          <Link
            to="/components/$slug"
            params={{ slug: component.slug }}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-ui-fg no-underline"
          >
            {component.name}
            <ArrowUpRightIcon className="size-3.5 text-ui-muted transition-colors group-hover:text-ui-brand" />
          </Link>
          <p className="mt-0.5 text-xs leading-5 text-ui-muted">{component.description}</p>
        </div>
      </div>
    );
  }

  const { Demo } = demo;

  return (
    <PreviewCard
      id={component.slug}
      slug={component.slug}
      name={component.name}
      path={componentPath(component.slug)}
      description={component.description}
      wide={component.wide ?? false}
      code={demo.code}
      highlightedCode={highlighted}
    >
      <LazyVisible>
        <Demo />
      </LazyVisible>
    </PreviewCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Content sections                                                            */
/* -------------------------------------------------------------------------- */

/** A titled band with a count badge and the responsive card grid. */
function GroupSection({ group, hl }: { group: ComponentGroup; hl: HighlightedCodes }) {
  return (
    <section id={group.id} className="mb-16 scroll-mt-28">
      <div className="mb-6 flex flex-col gap-2 border-b border-ui-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl leading-none font-bold tracking-tighter text-ui-fg">
            {group.label}
          </h2>
          {group.description ? (
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-ui-muted">{group.description}</p>
          ) : null}
        </div>
        <span className="w-fit shrink-0 rounded-full border border-ui-border bg-ui-surface px-2.5 py-1 text-xs font-semibold text-ui-muted tabular-nums">
          {group.items.length} components
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {group.items.map((component) => (
          <ComponentCard
            key={component.slug}
            component={component}
            highlighted={hl[component.slug] ?? ""}
          />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* View toggle                                                                 */
/* -------------------------------------------------------------------------- */

const VIEW_OPTIONS = [
  { value: "category", label: "Category" },
  { value: "alphabetical", label: "A–Z" },
] as const;

/** Segmented control switching the grid between grouped and A–Z layouts. */
function ViewToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className={`flex items-center gap-0.5 rounded-full border border-ui-border bg-ui-surface p-0.5 text-xs font-semibold ${className ?? ""}`}
    >
      {VIEW_OPTIONS.map(({ value: option, label }) => {
        const isActive = value === option;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              onChange(option);
            }}
            className={`flex-1 rounded-full px-3 py-1 whitespace-nowrap transition-colors ${
              isActive ? "bg-ui-card text-ui-fg shadow-sm" : "text-ui-muted hover:text-ui-fg"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar navigation (desktop) + compact jump nav (mobile)                    */
/* -------------------------------------------------------------------------- */

/** A single component entry in the sidebar; anchors to its on-page card, or
 *  links out to the detail page for docs-only components. */
function SidebarLink({ component, isActive }: { component: ComponentMeta; isActive: boolean }) {
  const className = `block truncate rounded-md px-2 py-1 text-xs no-underline transition-colors ${
    isActive
      ? "bg-ui-surface font-medium text-ui-fg"
      : "text-ui-muted hover:bg-ui-surface hover:text-ui-fg"
  }`;

  return (
    <a
      href={`#${component.slug}`}
      aria-current={isActive ? "location" : undefined}
      className={className}
    >
      {component.name}
    </a>
  );
}

/** Sticky left nav listing every component grouped by the active view mode. */
function SidebarNav({
  groups,
  activeSection,
  mode,
  onModeChange,
}: {
  groups: ReadonlyArray<ComponentGroup>;
  activeSection: string | null;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  const navRef = useRef<HTMLElement>(null);

  // Keep the active group visible as the page scrolls, adjusting only the nav's
  // own scroll (never the window). Also corrects any stale restored scrollTop.
  useEffect(() => {
    const nav = navRef.current;

    if (!nav || !activeSection) {
      return;
    }

    const link = nav.querySelector(`a[href="#${activeSection}"]`);

    if (!(link instanceof HTMLElement)) {
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    if (linkRect.top < navRect.top) {
      nav.scrollTop -= navRect.top - linkRect.top + 8;
    } else if (linkRect.bottom > navRect.bottom) {
      nav.scrollTop += linkRect.bottom - navRect.bottom + 8;
    }
  }, [activeSection]);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-4">
        <ViewToggle value={mode} onChange={onModeChange} />
        <nav
          ref={navRef}
          aria-label="Components"
          className="-mr-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2 pb-4"
        >
          {groups.map((group) => {
            const isActive = activeSection === group.id;

            return (
              <div key={group.id}>
                <a
                  href={`#${group.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs font-semibold tracking-wide uppercase no-underline transition-colors ${
                    isActive ? "text-ui-fg" : "text-ui-muted hover:text-ui-fg"
                  }`}
                >
                  {group.label}
                  <span className="tabular-nums opacity-60">{group.items.length}</span>
                </a>
                <div className="mt-1 space-y-0.5 border-l border-ui-border pl-2">
                  {group.items.map((component) => (
                    <SidebarLink
                      key={component.slug}
                      component={component}
                      isActive={activeSection === component.slug}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/** A pill link used in the mobile jump nav, styled by active state. */
function NavChip({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={isActive ? "location" : undefined}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold no-underline transition-colors ${
        isActive
          ? "border-ui-brand bg-ui-card text-ui-fg"
          : "border-ui-border bg-ui-surface text-ui-muted hover:border-ui-brand hover:text-ui-fg"
      }`}
    >
      {children}
    </a>
  );
}

/** Compact sticky controls shown above the grid on mobile (no sidebar there). */
function MobileNav({
  groups,
  activeSection,
  mode,
  onModeChange,
}: {
  groups: ReadonlyArray<ComponentGroup>;
  activeSection: string | null;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="sticky top-12 z-30 -mx-4 mb-10 flex flex-col gap-3 bg-ui-bg/75 px-4 py-3 backdrop-blur-[20px] lg:hidden">
      <ViewToggle value={mode} onChange={onModeChange} className="self-start" />
      <nav className="flex flex-wrap gap-2" aria-label="Jump to">
        {groups.map((group) => (
          <NavChip key={group.id} href={`#${group.id}`} isActive={activeSection === group.id}>
            {group.label}
            <span className="tabular-nums opacity-60">{group.items.length}</span>
          </NavChip>
        ))}
      </nav>
    </div>
  );
}

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
