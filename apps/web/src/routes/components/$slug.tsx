import type { ComponentType } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  CodeIcon,
  PackageIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@codefast/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@codefast/ui/breadcrumb";
import { Button } from "@codefast/ui/button";
import { highlightMany } from "#/lib/highlighter.ts";
import { CodeBlock } from "#/components/code-block";
import { DocSection } from "#/components/docs/doc-section";
import { ExamplePreview } from "#/components/docs/example-preview";
import { KeyboardTable } from "#/components/docs/keyboard-table";
import { OnThisPage, type TocItem } from "#/components/docs/on-this-page";
import { PropsTable } from "#/components/docs/props-table";
import { COMPONENT_DOCS } from "#/components/examples/docs";
import { DEMOS } from "#/components/examples/demos";
import { ALL_COMPONENTS, CATEGORIES, DEMO_COMPONENTS, componentPath } from "#/data/components";

const GITHUB_SRC = "https://github.com/codefastlabs/codefast/tree/main/packages/ui/src/components";
const NPM_URL = "https://www.npmjs.com/package/@codefast/ui";
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

function ComponentDetailPage() {
  const { slug } = Route.useParams();
  const { highlighted } = Route.useLoaderData();

  const component = ALL_COMPONENTS.find((c) => c.slug === slug);

  if (!component) {
    return <ComponentNotFound />;
  }

  const doc = COMPONENT_DOCS[slug];
  const examples = resolveExamples(slug);
  const category = CATEGORIES.find((c) => c.id === component.category);

  const index = DEMO_COMPONENTS.findIndex((c) => c.slug === slug);
  const previous = index > 0 ? DEMO_COMPONENTS[index - 1] : undefined;
  const next =
    index >= 0 && index < DEMO_COMPONENTS.length - 1 ? DEMO_COMPONENTS[index + 1] : undefined;

  const hasRelated = (doc?.related?.length ?? 0) > 0 || (doc?.dependencies?.length ?? 0) > 0;

  // Build the "On this page" entries from whichever sections are present.
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
  if (hasRelated) {
    toc.push({ id: "related", label: "Related", depth: 1 });
  }

  return (
    <main className="container mx-auto px-4 pt-10 pb-32">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/components">Components</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/components" hash={component.category}>
                {category?.label ?? component.category}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{component.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="mb-10 max-w-2xl">
        <Badge variant="outline" className="mb-4 border-ui-border text-ui-muted capitalize">
          {category?.label ?? component.category}
        </Badge>
        <h1 className="mb-4 text-4xl leading-none font-bold tracking-tighter text-ui-fg md:text-5xl">
          {component.name}
        </h1>
        <p className="mb-6 text-base leading-relaxed text-ui-muted">{component.description}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={`${GITHUB_SRC}/${slug}.tsx`} target="_blank" rel="noreferrer">
              <CodeIcon data-icon="inline-start" />
              Source
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={NPM_URL} target="_blank" rel="noreferrer">
              <PackageIcon data-icon="inline-start" />
              npm
            </a>
          </Button>
        </div>
      </header>

      {/* Install + import path */}
      <div className="mb-12 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-widest text-ui-muted uppercase">
            Install
          </p>
          <div className="rounded-xl border border-ui-border bg-ui-surface px-4 py-2.5 font-mono text-sm text-ui-fg">
            pnpm add @codefast/ui
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-widest text-ui-muted uppercase">
            Import path
          </p>
          <div className="truncate rounded-xl border border-ui-border bg-ui-surface px-4 py-2.5 font-mono text-sm text-ui-brand">
            {componentPath(slug)}
          </div>
        </div>
      </div>

      {/* Content + sticky On-this-page */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-12">
        <div className="min-w-0 space-y-16">
          {/* Examples */}
          {examples.length > 0 ? (
            <DocSection
              id="examples"
              title="Examples"
              description={
                doc
                  ? undefined
                  : "Live preview and copy-ready source. Explore more variants in your own app."
              }
            >
              <div className="space-y-10">
                {examples.map((example) => (
                  <ExamplePreview
                    key={example.id}
                    id={example.id}
                    title={example.title}
                    description={example.description}
                    code={example.code}
                    highlightedCode={highlighted[example.id] ?? ""}
                    previewClassName={example.previewClassName}
                  >
                    <example.Demo />
                  </ExamplePreview>
                ))}
              </div>
            </DocSection>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-ui-border bg-ui-surface p-10">
              <p className="max-w-sm text-center text-sm text-ui-muted">
                This component is best explored in your own app. See the source on GitHub for usage.
              </p>
            </div>
          )}

          {/* Anatomy */}
          {doc?.anatomy ? (
            <DocSection
              id="anatomy"
              title="Anatomy"
              description="How the parts compose. Copy this skeleton and fill in the slots."
            >
              <div className="overflow-hidden rounded-2xl border border-ui-border">
                <CodeBlock code={doc.anatomy} highlightedCode={highlighted[ANATOMY_KEY] ?? ""} />
              </div>
            </DocSection>
          ) : null}

          {/* API reference */}
          {doc?.api?.length ? (
            <DocSection
              id="api"
              title="API reference"
              description="Props for each part of the component. All native element props are also forwarded."
            >
              <div className="space-y-8">
                {doc.api.map((group) => (
                  <div key={group.name}>
                    <h3 className="mb-1 font-mono text-sm font-semibold text-ui-fg">
                      {group.name}
                    </h3>
                    {group.description ? (
                      <p className="mb-3 text-sm leading-relaxed text-ui-muted">
                        {group.description}
                      </p>
                    ) : (
                      <div className="mb-3" />
                    )}
                    <PropsTable rows={group.props} />
                  </div>
                ))}
              </div>
            </DocSection>
          ) : null}

          {/* Accessibility */}
          {doc?.accessibility ? (
            <DocSection
              id="accessibility"
              title="Accessibility"
              description="Built to be keyboard-navigable and screen-reader friendly out of the box."
            >
              <div className="space-y-6">
                {doc.accessibility.keyboard?.length ? (
                  <KeyboardTable rows={doc.accessibility.keyboard} />
                ) : null}
                {doc.accessibility.notes?.length ? (
                  <ul className="space-y-2">
                    {doc.accessibility.notes.map((note) => (
                      <li key={note} className="flex gap-2.5 text-sm leading-relaxed text-ui-muted">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-ui-brand" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </DocSection>
          ) : null}

          {/* Guidelines */}
          {doc?.guidelines ? (
            <DocSection
              id="guidelines"
              title="Guidelines"
              description="Conventions that keep usage consistent across an app."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {doc.guidelines.do?.length ? (
                  <div className="rounded-2xl border border-ui-border bg-ui-surface p-5">
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ui-fg">
                      <CheckIcon className="size-4 text-emerald-500" />
                      Do
                    </p>
                    <ul className="space-y-2.5">
                      {doc.guidelines.do.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-ui-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {doc.guidelines.dont?.length ? (
                  <div className="rounded-2xl border border-ui-border bg-ui-surface p-5">
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ui-fg">
                      <XIcon className="size-4 text-rose-500" />
                      Don’t
                    </p>
                    <ul className="space-y-2.5">
                      {doc.guidelines.dont.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-ui-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </DocSection>
          ) : null}

          {/* Dependencies + Related */}
          {hasRelated ? (
            <DocSection id="related" title="Related">
              {doc?.dependencies?.length ? (
                <div className="mb-6">
                  <p className="mb-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">
                    Built on
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {doc.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="rounded-full border border-ui-border bg-ui-surface px-3 py-1 font-mono text-xs text-ui-muted"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {doc?.related?.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">
                    Related components
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {doc.related.map((relatedSlug) => {
                      const target = ALL_COMPONENTS.find((c) => c.slug === relatedSlug);

                      if (!target) {
                        return null;
                      }

                      return (
                        <Link
                          key={relatedSlug}
                          to="/components/$slug"
                          params={{ slug: relatedSlug }}
                          className="rounded-full border border-ui-border bg-ui-card px-3 py-1 text-xs font-medium text-ui-muted no-underline transition-colors hover:border-ui-brand hover:text-ui-fg"
                        >
                          {target.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </DocSection>
          ) : null}

          {/* Prev / next */}
          <nav className="grid gap-4 border-t border-ui-border pt-8 sm:grid-cols-2">
            {previous ? (
              <Link
                to="/components/$slug"
                params={{ slug: previous.slug }}
                className="group flex flex-col gap-1 rounded-xl border border-ui-border p-4 no-underline transition-colors hover:border-ui-brand"
              >
                <span className="flex items-center gap-1.5 text-xs text-ui-muted">
                  <ArrowLeftIcon className="size-3.5" />
                  Previous
                </span>
                <span className="text-sm font-semibold text-ui-fg group-hover:text-ui-brand">
                  {previous.name}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                to="/components/$slug"
                params={{ slug: next.slug }}
                className="group flex flex-col items-end gap-1 rounded-xl border border-ui-border p-4 text-right no-underline transition-colors hover:border-ui-brand sm:col-start-2"
              >
                <span className="flex items-center gap-1.5 text-xs text-ui-muted">
                  Next
                  <ArrowRightIcon className="size-3.5" />
                </span>
                <span className="text-sm font-semibold text-ui-fg group-hover:text-ui-brand">
                  {next.name}
                </span>
              </Link>
            ) : null}
          </nav>
        </div>

        {/* Sticky On-this-page */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <OnThisPage items={toc} />
          </div>
        </aside>
      </div>
    </main>
  );
}
