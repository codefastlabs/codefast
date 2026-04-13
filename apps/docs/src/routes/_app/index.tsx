import { cn } from "@codefast/tailwind-variants";
import { HomeBentoShowcase } from "#components/home-showcase";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Separator } from "@codefast/ui/separator";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AccessibilityIcon,
  ArrowRightIcon,
  BlocksIcon,
  BrushIcon,
  CheckIcon,
  CodeIcon,
  ComponentIcon,
  CopyIcon,
  FormInputIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  MonitorIcon,
  MousePointerClickIcon,
  PackageIcon,
  PaletteIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "@codefast/ui — Modern React Component Library" },
      {
        name: "description",
        content:
          "Playground and docs for @codefast/ui: interactive components, theme and appearance tools, and install snippets. Radix UI, Tailwind CSS v4, 62 modules, TypeScript.",
      },
      { property: "og:title", content: "@codefast/ui — Modern React Component Library" },
      {
        property: "og:description",
        content:
          "Playground and docs for @codefast/ui: interactive components, theme and appearance tools, and install snippets. Radix UI, Tailwind CSS v4, 62 modules, TypeScript.",
      },
      { name: "twitter:title", content: "@codefast/ui — Modern React Component Library" },
      {
        name: "twitter:description",
        content:
          "Playground and docs for @codefast/ui: interactive components, theme and appearance tools, and install snippets. Radix UI, Tailwind CSS v4, 62 modules, TypeScript.",
      },
    ],
  }),
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className={cn(
        "shrink-0 p-1.5",
        "rounded-md",
        "text-muted-foreground",
        "transition-colors",
        "hover:bg-muted hover:text-foreground",
      )}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className={cn("size-4 text-green-800", "dark:text-green-400")} />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  titleId,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  titleId?: string;
}): ReactNode {
  return (
    <div className={cn("mx-auto mb-12 max-w-2xl", "text-center")}>
      {eyebrow ? (
        <p className={cn("mb-3", "text-xs font-semibold tracking-[0.2em] text-primary uppercase")}>
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={titleId}
        className={cn("mb-3", "text-3xl font-bold tracking-tight text-foreground", "md:text-4xl")}
      >
        {title}
      </h2>
      <p className="text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p>
    </div>
  );
}

const COMPONENT_CATEGORIES = [
  {
    icon: FormInputIcon,
    title: "Form controls",
    description: "Inputs, selects, validation, calendars, and form composition helpers.",
    count: 21,
  },
  {
    icon: LayoutDashboardIcon,
    title: "Layout",
    description: "Sidebars, navigation, scroll areas, split panes, and structure primitives.",
    count: 8,
  },
  {
    icon: MousePointerClickIcon,
    title: "Actions",
    description: "Buttons, groups, and toggles with multiple variants and sizes.",
    count: 4,
  },
  {
    icon: MessageSquareIcon,
    title: "Overlays",
    description: "Dialogs, sheets, menus, popovers, tooltips, and command palettes.",
    count: 11,
  },
  {
    icon: MonitorIcon,
    title: "Data display",
    description: "Tables, cards, charts, tabs, lists, and media-oriented components.",
    count: 11,
  },
  {
    icon: SparklesIcon,
    title: "Feedback",
    description: "Alerts, progress, loading states, toasts, and empty states.",
    count: 7,
  },
];

const FEATURES = [
  {
    icon: ComponentIcon,
    title: "62 Components",
    description:
      "A comprehensive set of accessible, composable UI component modules — plus 6 hooks and 4 primitives.",
  },
  {
    icon: PaletteIcon,
    title: "Themeable",
    description:
      "22 color themes with light & dark mode support. CSS custom properties make customization effortless.",
  },
  {
    icon: ZapIcon,
    title: "Performant",
    description: "Tree-shakeable exports, optimized bundle size, and zero unnecessary re-renders.",
  },
  {
    icon: AccessibilityIcon,
    title: "Accessible",
    description:
      "Built on Radix UI primitives with full WAI-ARIA compliance and keyboard navigation.",
  },
  {
    icon: BrushIcon,
    title: "Tailwind CSS v4",
    description:
      "First-class Tailwind CSS v4 integration with tailwind-variants for type-safe styling.",
  },
  {
    icon: BlocksIcon,
    title: "Composable",
    description: "Flexible compound component patterns that let you build exactly what you need.",
  },
];

function HomePage() {
  return (
    <div className={cn("min-h-screen", "bg-background")}>
      {/* Hero */}
      <section className={cn("relative", "overflow-hidden", "border-b border-border/80")}>
        <div
          className={cn(
            "absolute inset-0",
            "bg-[linear-gradient(to_right,hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.45)_1px,transparent_1px)] mask-[radial-gradient(ellipse_85%_70%_at_50%_-5%,#000_45%,transparent_100%)] bg-size-[3.5rem_3.5rem]",
            "pointer-events-none",
            "dark:bg-[linear-gradient(to_right,hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.25)_1px,transparent_1px)]",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-0",
            "bg-linear-to-b from-primary/6 via-transparent to-transparent",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute top-0 left-1/2",
            "h-112 w-[min(100%,56rem)]",
            "rounded-[100%]",
            "bg-linear-to-br from-primary/15 via-violet-500/10 to-transparent",
            "-translate-x-1/2 blur-3xl",
            "dark:from-primary/20",
          )}
          aria-hidden
        />

        <div
          className={cn(
            "relative",
            "mx-auto max-w-4xl px-4 pt-20 pb-16",
            "text-center",
            "sm:px-6",
            "md:pt-28 md:pb-24",
          )}
        >
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5",
              "mb-6 px-3 py-1.5",
              "border border-border/60",
              "bg-background/80 text-sm shadow-sm",
              "backdrop-blur-sm",
            )}
          >
            <PackageIcon className="size-3.5" aria-hidden />
            v0.3.9 — Open source
          </Badge>

          <h1 className={cn("mb-6", "text-5xl font-extrabold tracking-tight", "md:text-7xl")}>
            <span
              className={cn(
                "text-foreground",
                "dark:bg-linear-to-r dark:from-primary dark:via-violet-400 dark:to-fuchsia-400 dark:bg-clip-text dark:text-transparent",
              )}
            >
              @codefast/ui
            </span>
          </h1>

          <p
            className={cn(
              "mx-auto mb-4 max-w-2xl",
              "text-xl leading-relaxed text-pretty text-muted-foreground",
              "md:text-2xl",
            )}
          >
            Production-ready React components with Radix primitives, Tailwind CSS v4, and
            tree-shakeable imports—explore a live bento below, then dive into every module.
          </p>

          <p
            className={cn("mx-auto mb-10 max-w-xl", "text-base text-pretty text-muted-foreground")}
          >
            Tweak light, dark, or system mode on the theme page, copy install snippets, and ship
            accessible UI without reinventing patterns.
          </p>

          <div className={cn("flex flex-col items-center justify-center gap-3", "sm:flex-row")}>
            <Button asChild size="lg" className={cn("h-12 min-w-44 gap-2", "shadow-md")}>
              <Link to="/sink">
                Explore components
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn(
                "h-12 min-w-44 gap-2",
                "border-border/80",
                "bg-background/50",
                "backdrop-blur-sm",
              )}
            >
              <Link to="/theme">
                <PaletteIcon className="size-4" aria-hidden />
                Appearance
              </Link>
            </Button>
          </div>

          <dl
            className={cn(
              "mx-auto mt-14 grid max-w-xl grid-cols-3 gap-2 px-4 py-5",
              "rounded-2xl border border-border/60",
              "bg-card/40 text-center shadow-sm",
              "backdrop-blur-sm",
              "md:gap-4 md:px-6",
            )}
          >
            <div className={cn("pr-2", "border-r border-border/50", "md:pr-4")}>
              <dt className="sr-only">Component modules</dt>
              <dd className={cn("text-2xl font-bold text-foreground tabular-nums", "md:text-3xl")}>
                62
              </dd>
              <dt
                className={cn(
                  "mt-1",
                  "text-[0.65rem] font-medium text-muted-foreground uppercase",
                  "md:text-xs",
                )}
              >
                Components
              </dt>
            </div>
            <div className={cn("pr-2", "border-r border-border/50", "md:pr-4")}>
              <dt className="sr-only">Color themes</dt>
              <dd className={cn("text-2xl font-bold text-foreground tabular-nums", "md:text-3xl")}>
                22
              </dd>
              <dt
                className={cn(
                  "mt-1",
                  "text-[0.65rem] font-medium text-muted-foreground uppercase",
                  "md:text-xs",
                )}
              >
                Themes
              </dt>
            </div>
            <div>
              <dt className="sr-only">Custom hooks</dt>
              <dd className={cn("text-2xl font-bold text-foreground tabular-nums", "md:text-3xl")}>
                6
              </dd>
              <dt
                className={cn(
                  "mt-1",
                  "text-[0.65rem] font-medium text-muted-foreground uppercase",
                  "md:text-xs",
                )}
              >
                Hooks
              </dt>
            </div>
          </dl>
        </div>
      </section>

      {/* Bento + live demo */}
      <section
        className={cn(
          "px-4 py-16",
          "border-b border-border/60",
          "bg-linear-to-b from-muted/15 to-background",
          "sm:px-6",
          "md:py-24",
        )}
        aria-labelledby="showcase-heading"
      >
        <SectionHeading
          eyebrow="Interactive"
          title="A bento built from the library"
          description="Every control in this grid is a real import from @codefast/ui—the same paths you use in your app. Try tabs, fields, and actions; tokens follow your active appearance."
          titleId="showcase-heading"
        />
        <HomeBentoShowcase />
      </section>

      {/* Install */}
      <section
        className={cn("mx-auto w-full max-w-[1400px] px-4 py-16", "sm:px-6", "md:py-24")}
        aria-labelledby="install-heading"
      >
        <SectionHeading
          eyebrow="Quick start"
          title="Use the package in your project"
          description="Three steps: add the dependency, import the CSS preset and a palette, then import components by path."
          titleId="install-heading"
        />

        <div className={cn("max-w-2xl space-y-5", "mx-auto")}>
          <Card
            className={cn(
              "overflow-hidden",
              "border-border/80 shadow-sm",
              "transition-shadow",
              "hover:shadow-md",
            )}
          >
            <CardHeader className={cn("flex flex-row items-center gap-4 space-y-0", "pb-4")}>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center",
                  "rounded-full",
                  "bg-primary/10 text-sm font-bold text-primary",
                )}
              >
                1
              </span>
              <div>
                <CardTitle className="text-lg">Install the package</CardTitle>
                <CardDescription>Works with pnpm, npm, or yarn.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className={cn(
                  "flex items-center justify-between gap-3",
                  "px-4 py-3",
                  "rounded-xl border border-border/80",
                  "bg-muted/40 font-mono text-sm",
                )}
              >
                <code className={cn("min-w-0", "truncate text-foreground")}>
                  pnpm add @codefast/ui
                </code>
                <CopyButton text="pnpm add @codefast/ui" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "overflow-hidden",
              "border-border/80 shadow-sm",
              "transition-shadow",
              "hover:shadow-md",
            )}
          >
            <CardHeader className={cn("flex flex-row items-center gap-4 space-y-0", "pb-4")}>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center",
                  "rounded-full",
                  "bg-primary/10 text-sm font-bold text-primary",
                )}
              >
                2
              </span>
              <div>
                <CardTitle className="text-lg">Import the styles</CardTitle>
                <CardDescription>Add preset and a color theme in your global CSS.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className={cn(
                  "space-y-1",
                  "px-4 py-3",
                  "rounded-xl border border-border/80",
                  "bg-muted/40 font-mono text-sm leading-relaxed",
                )}
              >
                <div className="text-muted-foreground">{"/* globals.css */"}</div>
                <div>
                  <span className={cn("text-blue-800", "dark:text-blue-400")}>@import</span>{" "}
                  <span className={cn("text-green-800", "dark:text-green-400")}>
                    &apos;@codefast/ui/css/preset.css&apos;
                  </span>
                  ;
                </div>
                <div>
                  <span className={cn("text-blue-800", "dark:text-blue-400")}>@import</span>{" "}
                  <span className={cn("text-green-800", "dark:text-green-400")}>
                    &apos;@codefast/ui/css/neutral.css&apos;
                  </span>
                  ;
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "overflow-hidden",
              "border-border/80 shadow-sm",
              "transition-shadow",
              "hover:shadow-md",
            )}
          >
            <CardHeader className={cn("flex flex-row items-center gap-4 space-y-0", "pb-4")}>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center",
                  "rounded-full",
                  "bg-primary/10 text-sm font-bold text-primary",
                )}
              >
                3
              </span>
              <div>
                <CardTitle className="text-lg">Use the components</CardTitle>
                <CardDescription>Tree-shakeable entry points per component.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className={cn(
                  "space-y-1",
                  "px-4 py-3",
                  "rounded-xl border border-border/80",
                  "bg-muted/40 font-mono text-sm leading-relaxed",
                )}
              >
                <div>
                  <span className={cn("text-blue-800", "dark:text-blue-400")}>import</span>
                  {" { Button } "}
                  <span className={cn("text-blue-800", "dark:text-blue-400")}>from</span>{" "}
                  <span className={cn("text-green-800", "dark:text-green-400")}>
                    &apos;@codefast/ui/button&apos;
                  </span>
                  ;
                </div>
                <div className="mt-2">
                  <span className={cn("text-purple-800", "dark:text-purple-400")}>{"<"}</span>
                  <span className={cn("text-blue-800", "dark:text-blue-400")}>Button</span>
                  <span className={cn("text-purple-800", "dark:text-purple-400")}>{">"}</span>
                  Click me
                  <span className={cn("text-purple-800", "dark:text-purple-400")}>{"</"}</span>
                  <span className={cn("text-blue-800", "dark:text-blue-400")}>Button</span>
                  <span className={cn("text-purple-800", "dark:text-purple-400")}>{">"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="opacity-60" />

      {/* Features */}
      <section
        className={cn("mx-auto w-full max-w-[1400px] px-4 py-16", "sm:px-6", "md:py-24")}
        aria-labelledby="features-heading"
      >
        <div className={cn("mx-auto mb-12 max-w-2xl", "text-center")}>
          <p
            className={cn("mb-3", "text-xs font-semibold tracking-[0.2em] text-primary uppercase")}
          >
            Library
          </p>
          <h2
            className={cn(
              "mb-3",
              "text-3xl font-bold tracking-tight text-foreground",
              "md:text-4xl",
            )}
            id="features-heading"
          >
            What @codefast/ui includes
          </h2>
          <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
            Opinionated defaults on top of open primitives—suitable for internal tools and
            customer-facing products alike.
          </p>
        </div>

        <div className={cn("grid grid-cols-1 gap-5", "md:grid-cols-2", "lg:grid-cols-3")}>
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className={cn(
                "group",
                "border-border/80",
                "bg-card/60 shadow-sm",
                "transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
              )}
            >
              <CardHeader className="pb-2">
                <div
                  className={cn(
                    "mb-3 flex size-11 items-center justify-center",
                    "rounded-xl ring-1 ring-primary/15",
                    "bg-primary/10",
                    "transition-colors",
                    "group-hover:bg-primary/15",
                  )}
                >
                  <feature.icon className={cn("size-5", "text-primary")} aria-hidden />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="opacity-60" />

      {/* Component Categories */}
      <section
        className={cn("mx-auto w-full max-w-[1400px] px-4 py-16", "sm:px-6", "md:py-24")}
        aria-labelledby="library-heading"
      >
        <SectionHeading
          eyebrow="Components"
          title="Browse by category"
          description="Demos are grouped by role on the Components page. Start from a category or jump straight in—every module has a live example."
          titleId="library-heading"
        />

        <div className={cn("grid grid-cols-1 gap-4", "md:grid-cols-2", "lg:grid-cols-3")}>
          {COMPONENT_CATEGORIES.map((category) => (
            <Card
              key={category.title}
              className={cn(
                "group",
                "border-border/80",
                "bg-card/50",
                "transition-all duration-200",
                "hover:border-violet-500/30 hover:shadow-md",
                "dark:hover:border-violet-400/25",
              )}
            >
              <CardContent className={cn("flex items-start gap-4", "p-5")}>
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center",
                    "rounded-xl",
                    "bg-violet-500/10",
                    "transition-colors",
                    "group-hover:bg-violet-500/18",
                  )}
                >
                  <category.icon
                    className={cn("size-5 text-violet-800", "dark:text-violet-400")}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn("flex flex-wrap items-center gap-2", "mb-1.5")}>
                    <h3 className="text-sm font-semibold text-foreground">{category.title}</h3>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {category.count} modules
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={cn("mt-12", "text-center")}>
          <Button asChild variant="outline" size="lg" className="h-12 gap-2">
            <Link to="/sink">
              <CodeIcon className="size-4" aria-hidden />
              Open components
            </Link>
          </Button>
        </div>
      </section>

      <Separator className="opacity-60" />

      {/* Theme CTA */}
      <section
        className={cn("mx-auto w-full max-w-[1400px] px-4 py-16", "sm:px-6", "md:py-24")}
        aria-labelledby="themes-heading"
      >
        <SectionHeading
          eyebrow="Appearance"
          title="Light, dark, and accent palettes"
          description="Use this site’s theme page to switch color mode. For brand colors, import one of 22 palette CSS files from the package—the components section includes a theme picker wired to those imports."
          titleId="themes-heading"
        />

        <div className="text-center">
          <Button asChild variant="outline" size="lg" className="h-12 gap-2">
            <Link to="/theme">
              <PaletteIcon className="size-4" aria-hidden />
              Theme &amp; appearance
            </Link>
          </Button>
        </div>
      </section>

      <Separator className="opacity-60" />

      {/* Tech Stack */}
      <section
        className={cn("mx-auto w-full max-w-[1400px] px-4 py-16", "sm:px-6", "md:py-24")}
        aria-labelledby="stack-heading"
      >
        <SectionHeading
          eyebrow="Stack"
          title="Built on familiar tools"
          description="React, Radix, Tailwind, and TypeScript—no bespoke runtime beyond what you already adopt."
          titleId="stack-heading"
        />

        <div className={cn("grid grid-cols-2 gap-3", "md:grid-cols-4 md:gap-4")}>
          {[
            { name: "React 19", description: "UI framework" },
            { name: "Radix UI", description: "Primitives" },
            { name: "Tailwind v4", description: "Styling" },
            { name: "TypeScript", description: "Type safety" },
          ].map((tech) => (
            <div
              key={tech.name}
              className={cn(
                "flex flex-col items-center",
                "px-4 py-6",
                "rounded-2xl border border-border/80",
                "bg-muted/25 text-center",
                "transition-colors",
                "hover:bg-muted/45",
                "md:py-8",
              )}
            >
              <span className={cn("mb-1", "text-sm font-semibold text-foreground")}>
                {tech.name}
              </span>
              <span className="text-xs text-muted-foreground">{tech.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className={cn(
          "px-4 py-16",
          "border-t border-border/80",
          "bg-linear-to-b from-muted/30 to-background",
          "sm:px-6",
          "md:py-24",
        )}
      >
        <div className={cn("max-w-2xl", "mx-auto", "text-center")}>
          <h2
            className={cn(
              "mb-3",
              "text-2xl font-bold tracking-tight text-foreground",
              "md:text-3xl",
            )}
          >
            Next step
          </h2>
          <p className={cn("mb-10", "text-pretty text-muted-foreground")}>
            Browse components for interactive examples, or adjust appearance on the theme page
            before you wire palettes into your codebase.
          </p>

          <div className={cn("flex flex-col items-center justify-center gap-3", "sm:flex-row")}>
            <Button asChild size="lg" className={cn("h-12 min-w-48 gap-2", "shadow-md")}>
              <Link to="/sink">
                <CodeIcon className="size-4" aria-hidden />
                All components
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn("h-12 gap-2 text-muted-foreground", "hover:text-foreground")}
            >
              <a
                href="https://github.com/codefastlabs/codefast"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ArrowRightIcon className="size-4" aria-hidden />
              </a>
            </Button>
          </div>

          <p className={cn("mt-14", "text-sm text-muted-foreground")}>
            Made with care by{" "}
            <a
              href="https://github.com/codefastlabs"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-medium text-foreground underline-offset-4",
                "transition-colors",
                "hover:underline",
              )}
            >
              codefastlabs
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
