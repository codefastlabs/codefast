import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, ArrowRightIcon, ChevronRightIcon } from "lucide-react";
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
import { DEMOS } from "#/components/examples/demos";
import { ALL_COMPONENTS, CATEGORIES, DEMO_COMPONENTS, componentPath } from "#/data/components";

interface DetailLoaderData {
  readonly highlightedCode: string;
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

    const demo = DEMOS[component.slug];
    const highlightedCode = demo ? ((await highlightMany([demo.code]))[0] ?? "") : "";

    return { highlightedCode };
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
  const { highlightedCode } = Route.useLoaderData();

  const component = ALL_COMPONENTS.find((c) => c.slug === slug);

  if (!component) {
    return <ComponentNotFound />;
  }

  const demo = DEMOS[slug];
  const category = CATEGORIES.find((c) => c.id === component.category);

  const index = DEMO_COMPONENTS.findIndex((c) => c.slug === slug);
  const previous = index > 0 ? DEMO_COMPONENTS[index - 1] : undefined;
  const next =
    index >= 0 && index < DEMO_COMPONENTS.length - 1 ? DEMO_COMPONENTS[index + 1] : undefined;

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
        <p className="text-base leading-relaxed text-ui-muted">{component.description}</p>
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

      {/* Live preview */}
      <p className="mb-3 text-xs font-semibold tracking-widest text-ui-muted uppercase">Preview</p>
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-ui-border bg-ui-surface p-10">
        {demo ? (
          <demo.Demo />
        ) : (
          <p className="max-w-sm text-center text-sm text-ui-muted">
            This component is best explored in your own app. See the source on GitHub for usage.
          </p>
        )}
      </div>

      {/* Source code */}
      {demo ? (
        <>
          <p className="mt-12 mb-3 text-xs font-semibold tracking-widest text-ui-muted uppercase">
            Example source
          </p>
          <div className="overflow-hidden rounded-2xl border border-ui-border">
            <CodeBlock code={demo.code} highlightedCode={highlightedCode} />
          </div>
        </>
      ) : null}

      {/* Prev / next */}
      <nav className="mt-16 grid gap-4 border-t border-ui-border pt-8 sm:grid-cols-2">
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
    </main>
  );
}
