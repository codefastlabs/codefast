import type { ComponentType } from "react";
import type { ComponentDoc } from "#/components/examples/docs/types";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { highlightMany } from "#/lib/highlighter.ts";
import { OnThisPage, type TocItem } from "#/components/docs/on-this-page";
import { AccessibilitySection } from "#/components/docs/sections/accessibility-section";
import { AnatomySection } from "#/components/docs/sections/anatomy-section";
import { ApiSection } from "#/components/docs/sections/api-section";
import { ComponentDetailHeader } from "#/components/docs/sections/detail-header";
import { ComponentPager } from "#/components/docs/sections/component-pager";
import { ExamplesSection } from "#/components/docs/sections/examples-section";
import { GuidelinesSection } from "#/components/docs/sections/guidelines-section";
import { RelatedSection } from "#/components/docs/sections/related-section";
import { COMPONENT_DOCS } from "#/components/examples/docs";
import { DEMOS } from "#/components/examples/demos";
import { ALL_COMPONENTS, DEMO_COMPONENTS } from "#/data/components";

const ANATOMY_KEY = "__anatomy__";

interface ResolvedExample {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly Demo: ComponentType;
  readonly code: string;
  readonly previewClassName?: string;
}

/**
 * The examples shown on a detail page: the curated list from the rich docs
 * registry, or a single example synthesised from the card demo as a fallback.
 * Shared by the loader (to highlight code) and the component (to render).
 */
function resolveExamples(slug: string): ReadonlyArray<ResolvedExample> {
  const doc = COMPONENT_DOCS[slug];

  if (doc) {
    return doc.examples;
  }

  const demo = DEMOS[slug];

  if (demo) {
    return [{ id: "example", title: "Example", Demo: demo.Demo, code: demo.code }];
  }

  return [];
}

interface DetailLoaderData {
  /** Highlighted Shiki HTML keyed by example id (and `ANATOMY_KEY`). */
  readonly highlighted: Record<string, string>;
}

export const Route = createFileRoute("/components/$slug")({
  head: ({ params }: { params: { slug: string } }) => {
    const component = ALL_COMPONENTS.find((c) => c.slug === params.slug);

    return {
      meta: [
        { title: `${component?.name ?? "Component"} — codefast/ui` },
        {
          name: "description",
          content: component?.description ?? "A composable codefast/ui component.",
        },
      ],
    };
  },
  loader: async ({ params }): Promise<DetailLoaderData> => {
    const component = ALL_COMPONENTS.find((c) => c.slug === params.slug);

    if (!component) {
      throw notFound();
    }

    const examples = resolveExamples(component.slug);
    const anatomy = COMPONENT_DOCS[component.slug]?.anatomy;
    const codes = examples.map((example) => example.code);
    const highlightedList = await highlightMany(anatomy ? [...codes, anatomy] : codes);

    const highlighted: Record<string, string> = {};
    examples.forEach((example, index) => {
      highlighted[example.id] = highlightedList[index] ?? "";
    });

    if (anatomy) {
      highlighted[ANATOMY_KEY] = highlightedList[examples.length] ?? "";
    }

    return { highlighted };
  },
  staleTime: Infinity,
  notFoundComponent: ComponentNotFound,
  component: ComponentDetailPage,
});

function ComponentNotFound() {
  return (
    <main className="container mx-auto flex flex-col items-center px-4 pt-32 pb-32 text-center">
      <Badge variant="outline" className="mb-5 border-ui-border text-ui-muted">
        404
      </Badge>
      <h1 className="mb-3 text-3xl font-bold tracking-tighter text-ui-fg">Component not found</h1>
      <p className="mb-8 max-w-sm text-ui-muted">
        We couldn’t find that component. It may have been renamed or removed.
      </p>
      <Button asChild>
        <Link to="/components">Browse all components</Link>
      </Button>
    </main>
  );
}

/** Builds the "On this page" entries from whichever sections are present. */
function buildToc(examples: ReadonlyArray<ResolvedExample>, doc?: ComponentDoc): Array<TocItem> {
  const toc: Array<TocItem> = [];

  if (examples.length > 0) {
    toc.push({ id: "examples", label: "Examples", depth: 1 });

    if (examples.length > 1) {
      for (const example of examples) {
        toc.push({ id: example.id, label: example.title, depth: 2 });
      }
    }
  }
  if (doc?.anatomy) {
    toc.push({ id: "anatomy", label: "Anatomy", depth: 1 });
  }
  if (doc?.api?.length) {
    toc.push({ id: "api", label: "API reference", depth: 1 });
  }
  if (doc?.accessibility) {
    toc.push({ id: "accessibility", label: "Accessibility", depth: 1 });
  }
  if (doc?.guidelines) {
    toc.push({ id: "guidelines", label: "Guidelines", depth: 1 });
  }
  if (doc?.related?.length || doc?.dependencies?.length) {
    toc.push({ id: "related", label: "Related", depth: 1 });
  }

  return toc;
}

function ComponentDetailPage() {
  const { slug } = Route.useParams();
  const { highlighted } = Route.useLoaderData();

  const component = ALL_COMPONENTS.find((c) => c.slug === slug);

  if (!component) {
    return <ComponentNotFound />;
  }

  const doc = COMPONENT_DOCS[slug];
  const examples = resolveExamples(slug);

  const index = DEMO_COMPONENTS.findIndex((c) => c.slug === slug);
  const previous = index > 0 ? DEMO_COMPONENTS[index - 1] : undefined;
  const next =
    index >= 0 && index < DEMO_COMPONENTS.length - 1 ? DEMO_COMPONENTS[index + 1] : undefined;

  const hasRelated = (doc?.related?.length ?? 0) > 0 || (doc?.dependencies?.length ?? 0) > 0;
  const toc = buildToc(examples, doc);

  return (
    <main className="container mx-auto px-4 pt-10 pb-32">
      <ComponentDetailHeader component={component} />

      {/* Content + sticky On-this-page */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-12">
        <div className="min-w-0 space-y-16">
          {examples.length > 0 ? (
            <ExamplesSection examples={examples} highlighted={highlighted} showHint={!doc} />
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-ui-border bg-ui-surface p-10">
              <p className="max-w-sm text-center text-sm text-ui-muted">
                This component is best explored in your own app. See the source on GitHub for usage.
              </p>
            </div>
          )}

          {doc?.anatomy ? (
            <AnatomySection code={doc.anatomy} highlightedCode={highlighted[ANATOMY_KEY] ?? ""} />
          ) : null}

          {doc?.api?.length ? <ApiSection groups={doc.api} /> : null}

          {doc?.accessibility ? (
            <AccessibilitySection
              keyboard={doc.accessibility.keyboard}
              notes={doc.accessibility.notes}
            />
          ) : null}

          {doc?.guidelines ? (
            <GuidelinesSection do={doc.guidelines.do} dont={doc.guidelines.dont} />
          ) : null}

          {hasRelated ? (
            <RelatedSection dependencies={doc?.dependencies} related={doc?.related} />
          ) : null}

          <ComponentPager previous={previous} next={next} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <OnThisPage items={toc} />
          </div>
        </aside>
      </div>
    </main>
  );
}
