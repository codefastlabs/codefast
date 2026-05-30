import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { Badge } from "@codefast/ui/badge";
import { highlightMany } from "#/lib/highlighter.ts";
import { LazyVisible } from "#/components/lazy-visible";
import { PreviewCard } from "#/components/preview-card";
import { DEMOS } from "#/components/examples/demos";
import type { CategoryId } from "#/data/components";
import { ALL_COMPONENTS, CATEGORIES, componentPath, DEMO_COMPONENTS } from "#/data/components";

/* -------------------------------------------------------------------------- */
/* Route — highlight every demo's source at load time, keyed by slug          */
/* -------------------------------------------------------------------------- */

type HighlightedCodes = Record<string, string>;

export const Route = createFileRoute("/components/")({
  head: () => ({
    meta: [
      { title: "Components — codefast/ui" },
      {
        name: "description",
        content:
          "Browse the full @codefast/ui component library — live previews and copy-ready source for every component, grouped by category.",
      },
    ],
  }),
  loader: async (): Promise<HighlightedCodes> => {
    const slugs = DEMO_COMPONENTS.map((c) => c.slug);
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
/* Shared section component                                                    */
/* -------------------------------------------------------------------------- */

type SectionProps = {
  readonly id: CategoryId;
  readonly label: string;
  readonly description: string;
  readonly count: number;
  readonly children: ReactNode;
};

function Section({ id, label, description, count, children }: SectionProps) {
  return (
    <section id={id} className="mb-20 scroll-mt-28">
      <div className="mb-8 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[0.7rem] font-semibold tracking-widest text-primary uppercase">
            {label}
          </p>
          <h2 className="text-2xl leading-[1.05] font-bold tracking-[-0.035em] text-foreground">
            {label}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground tabular-nums">
          {count} components
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

type FilterId = "all" | CategoryId;

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** Tracks which category section is currently in view for the quick-nav. */
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

const CATEGORY_COUNTS = Object.fromEntries(
  CATEGORIES.map(({ id }): [CategoryId, number] => [
    id,
    DEMO_COMPONENTS.filter((c) => c.category === id).length,
  ]),
) as Record<CategoryId, number>;

type FilterOption = { readonly id: FilterId; readonly label: string };

const FILTER_OPTIONS: ReadonlyArray<FilterOption> = [
  { id: "all", label: "All" },
  ...CATEGORIES.map(({ id, label }) => ({ id, label })),
];

function ComponentsPage() {
  const hl = Route.useLoaderData();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const activeSection = useActiveSection(CATEGORY_IDS);
  const hash = useLocation({ select: (location) => location.hash });

  // Scroll to the targeted component/section after navigation. Runs after
  // layout (and wins over scroll restoration) via a short delay; scroll-margin
  // on the targets handles the sticky header + category-nav offset.
  useEffect(() => {
    if (!hash) {
      return;
    }

    const id = hash.replace(/^#/, "");
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => {
      clearTimeout(timer);
    };
  }, [hash]);

  const filteredAll = useMemo(
    () =>
      activeFilter === "all"
        ? DEMO_COMPONENTS
        : DEMO_COMPONENTS.filter((c) => c.category === activeFilter),
    [activeFilter],
  );

  return (
    <main className="mx-auto w-[min(1080px,calc(100%-2rem))] px-4 pt-16 pb-32">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="mb-16 max-w-2xl animate-in duration-800 ease-out fill-mode-both fade-in slide-in-from-bottom-4">
        <Badge variant="outline" className="mb-5 border-border text-muted-foreground">
          Components
        </Badge>
        <h1 className="mb-5 text-[clamp(40px,5vw,64px)] leading-[1.05] font-bold tracking-[-0.035em] text-foreground">
          {ALL_COMPONENTS.length}+ ready-to-use <span className="text-primary">components.</span>
        </h1>
        <p className="text-[17px] leading-relaxed text-muted-foreground">
          Built on Radix UI primitives with Tailwind CSS v4. Each component ships as a named
          sub-path import — no barrel files, no tree-shaking surprises, no config required.
        </p>
      </section>

      {/* ── Full component map ───────────────────────────────────────── */}
      <section className="mb-16 rounded-2xl border border-border bg-muted p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            All components
            <span className="ml-2 font-normal text-muted-foreground">
              · {filteredAll.length} shown
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={activeFilter === id}
                onClick={() => setActiveFilter(id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilter === id
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredAll.map(({ name, slug, category }) => (
            <a
              key={slug}
              href={`#${category}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground no-underline transition-colors hover:border-primary hover:text-foreground"
            >
              {name}
            </a>
          ))}
        </div>
      </section>

      {/* ── Category quick-nav ──────────────────────────────────────── */}
      <nav
        className="sticky top-12 z-30 -mx-4 mb-16 flex flex-wrap gap-2 bg-background/75 px-4 py-3 backdrop-blur-[20px]"
        aria-label="Component categories"
      >
        {CATEGORIES.map(({ id, label }) => {
          const isActive = activeSection === id;

          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isActive ? "location" : undefined}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold no-underline transition-colors ${
                isActive
                  ? "border-primary bg-card text-foreground"
                  : "border-border bg-muted text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {label}
              <span className="tabular-nums opacity-60">{CATEGORY_COUNTS[id]}</span>
            </a>
          );
        })}
      </nav>

      {/* ── Sections — one per category, fully data-driven ───────────── */}
      {CATEGORIES.map(({ id, label, description }) => {
        const items = DEMO_COMPONENTS.filter((c) => c.category === id);

        return (
          <Section key={id} id={id} label={label} description={description} count={items.length}>
            {items.map((c) => {
              const demo = DEMOS[c.slug];

              if (!demo) {
                return null;
              }

              const { Demo } = demo;

              return (
                <PreviewCard
                  key={c.slug}
                  id={c.slug}
                  slug={c.slug}
                  name={c.name}
                  path={componentPath(c.slug)}
                  description={c.description}
                  wide={c.wide ?? false}
                  code={demo.code}
                  highlightedCode={hl[c.slug] ?? ""}
                >
                  <LazyVisible>
                    <Demo />
                  </LazyVisible>
                </PreviewCard>
              );
            })}
          </Section>
        );
      })}
    </main>
  );
}
