import { cn } from "@codefast/tailwind-variants";
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
    <main
      className={cn(
        "container flex flex-col items-center",
        "mx-auto px-4 pt-32 pb-32",
        "text-center",
      )}
    >
      <Badge variant="outline" className={cn("mb-5", "border-border", "text-muted-foreground")}>
        404
      </Badge>
      <h1 className={cn("mb-3", "text-3xl font-bold tracking-[-0.035em] text-foreground")}>
        Component not found
      </h1>
      <p className="mb-8 max-w-sm text-muted-foreground">
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
    <main className={cn("container", "mx-auto px-4 pt-10 pb-32")}>
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
        <Badge
          variant="outline"
          className={cn("mb-4", "border-border", "text-muted-foreground capitalize")}
        >
          {category?.label ?? component.category}
        </Badge>
        <h1
          className={cn(
            "mb-4",
            "text-[clamp(32px,4vw,48px)] leading-[1.05] font-bold tracking-[-0.035em] text-foreground",
          )}
        >
          {component.name}
        </h1>
        <p className="text-[17px] leading-relaxed text-muted-foreground">{component.description}</p>
      </header>

      {/* Install + import path */}
      <div className={cn("grid gap-3", "mb-12", "sm:grid-cols-2")}>
        <div>
          <p
            className={cn(
              "mb-1.5",
              "text-xs font-semibold tracking-widest text-muted-foreground uppercase",
            )}
          >
            Install
          </p>
          <div
            className={cn(
              "px-4 py-2.5",
              "rounded-xl border border-border",
              "bg-muted font-mono text-sm text-foreground",
            )}
          >
            pnpm add @codefast/ui
          </div>
        </div>
        <div>
          <p
            className={cn(
              "mb-1.5",
              "text-xs font-semibold tracking-widest text-muted-foreground uppercase",
            )}
          >
            Import path
          </p>
          <div
            className={cn(
              "px-4 py-2.5",
              "rounded-xl border border-border",
              "truncate bg-muted font-mono text-sm text-primary",
            )}
          >
            {componentPath(slug)}
          </div>
        </div>
      </div>

      {/* Live preview */}
      <p
        className={cn(
          "mb-3",
          "text-xs font-semibold tracking-widest text-muted-foreground uppercase",
        )}
      >
        Preview
      </p>
      <div
        className={cn(
          "flex min-h-64 items-center justify-center p-10",
          "rounded-2xl border border-border",
          "bg-muted",
        )}
      >
        {demo ? (
          <demo.Demo />
        ) : (
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            This component is best explored in your own app. See the source on GitHub for usage.
          </p>
        )}
      </div>

      {/* Source code */}
      {demo ? (
        <>
          <p
            className={cn(
              "mt-12 mb-3",
              "text-xs font-semibold tracking-widest text-muted-foreground uppercase",
            )}
          >
            Example source
          </p>
          <div className={cn("overflow-hidden", "rounded-2xl border border-border")}>
            <CodeBlock code={demo.code} highlightedCode={highlightedCode} />
          </div>
        </>
      ) : null}

      {/* Prev / next */}
      <nav className={cn("grid gap-4", "mt-16 pt-8", "border-t border-border", "sm:grid-cols-2")}>
        {previous ? (
          <Link
            to="/components/$slug"
            params={{ slug: previous.slug }}
            className={cn(
              "group flex flex-col gap-1",
              "p-4",
              "rounded-xl border border-border",
              "no-underline",
              "transition-colors",
              "hover:border-primary",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowLeftIcon className="size-3.5" />
              Previous
            </span>
            <span
              className={cn("text-sm font-semibold text-foreground", "group-hover:text-primary")}
            >
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
            className={cn(
              "group flex flex-col items-end gap-1",
              "p-4",
              "rounded-xl border border-border",
              "text-right no-underline",
              "transition-colors",
              "hover:border-primary",
              "sm:col-start-2",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Next
              <ArrowRightIcon className="size-3.5" />
            </span>
            <span
              className={cn("text-sm font-semibold text-foreground", "group-hover:text-primary")}
            >
              {next.name}
            </span>
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
