import { cn } from "@codefast/tailwind-variants";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
    <section id={id} className={cn("mb-20", "scroll-mt-28")}>
      <div
        className={cn(
          "flex flex-col gap-3",
          "mb-8 pb-6",
          "border-b border-border",
          "sm:flex-row sm:items-end sm:justify-between",
        )}
      >
        <div>
          <h2 className="text-2xl leading-[1.05] font-bold tracking-[-0.035em] text-foreground">
            {label}
          </h2>
          <p className={cn("mt-1.5 max-w-xl", "text-sm leading-6 text-muted-foreground")}>
            {description}
          </p>
        </div>
        <span
          className={cn(
            "w-fit shrink-0 px-2.5 py-1",
            "rounded-full border border-border",
            "bg-muted text-xs font-semibold text-muted-foreground tabular-nums",
          )}
        >
          {count} components
        </span>
      </div>
      <div className={cn("grid gap-4", "sm:grid-cols-2", "lg:grid-cols-3")}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

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

function ComponentsPage() {
  const hl = Route.useLoaderData();
  const activeSection = useActiveSection(CATEGORY_IDS);
  const hash = useLocation({ select: (location) => location.hash });

  // Scroll to the targeted component/section after navigation. A single rAF
  // defers the scroll until after the post-navigation layout has committed, so
  // it lands on the right element and wins over scroll restoration; scroll-margin
  // on the targets handles the sticky header + category-nav offset.
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
    <main className={cn("container", "mx-auto px-4 pt-16 pb-32")}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section
        className={cn(
          "mb-16 max-w-2xl",
          "fill-mode-both",
          "animate-in duration-800 ease-out",
          "fade-in slide-in-from-bottom-4",
        )}
      >
        <Badge variant="outline" className={cn("mb-5", "border-border", "text-muted-foreground")}>
          Components
        </Badge>
        <h1
          className={cn(
            "mb-5",
            "text-[clamp(40px,5vw,64px)] leading-[1.05] font-bold tracking-[-0.035em] text-foreground",
          )}
        >
          {ALL_COMPONENTS.length}+ ready-to-use <span className="text-primary">components.</span>
        </h1>
        <p className="text-[17px] leading-relaxed text-muted-foreground">
          Built on Radix UI primitives with Tailwind CSS v4. Each component ships as a named
          sub-path import — no barrel files, no tree-shaking surprises, no config required.
        </p>
      </section>

      {/* ── Full component map ───────────────────────────────────────── */}
      <section
        className={cn("mb-16 p-6", "rounded-2xl border border-border", "bg-muted", "sm:p-8")}
      >
        <p className={cn("mb-5", "text-sm font-semibold text-foreground")}>
          All components
          <span className={cn("ml-2", "font-normal text-muted-foreground")}>
            · {DEMO_COMPONENTS.length} components
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_COMPONENTS.map(({ name, slug }) => (
            <a
              key={slug}
              href={`#${slug}`}
              className={cn(
                "px-3 py-1",
                "rounded-full border border-border",
                "bg-card text-xs font-medium text-muted-foreground no-underline",
                "transition-colors",
                "hover:border-primary hover:text-foreground",
              )}
            >
              {name}
            </a>
          ))}
        </div>
      </section>

      {/* ── Category quick-nav ──────────────────────────────────────── */}
      <nav
        className={cn(
          "sticky top-12 z-30 flex flex-wrap gap-2",
          "-mx-4 mb-16 px-4 py-3",
          "bg-background/75",
          "backdrop-blur-[20px]",
        )}
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
              <span className={cn("tabular-nums", "opacity-60")}>{CATEGORY_COUNTS[id]}</span>
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
