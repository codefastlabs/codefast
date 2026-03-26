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
  MoonIcon,
  MousePointerClickIcon,
  PackageIcon,
  PaletteIcon,
  SparklesIcon,
  SunIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "@codefast/ui — Modern React Component Library" },
      {
        name: "description",
        content:
          "A modern, accessible, and beautifully crafted React component library built with Radix UI and Tailwind CSS. 62 components, 22 themes, dark mode, and full TypeScript support.",
      },
      { property: "og:title", content: "@codefast/ui — Modern React Component Library" },
      {
        property: "og:description",
        content:
          "A modern, accessible, and beautifully crafted React component library built with Radix UI and Tailwind CSS. 62 components, 22 themes, dark mode, and full TypeScript support.",
      },
      { name: "twitter:title", content: "@codefast/ui — Modern React Component Library" },
      {
        name: "twitter:description",
        content:
          "A modern, accessible, and beautifully crafted React component library built with Radix UI and Tailwind CSS. 62 components, 22 themes, dark mode, and full TypeScript support.",
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
      onClick={handleCopy}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy to clipboard"
    >
      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
    </button>
  );
}

const COMPONENT_CATEGORIES = [
  {
    icon: FormInputIcon,
    title: "Form Controls",
    description:
      "Input, InputNumber, InputPassword, InputSearch, InputOTP, InputGroup, Textarea, Select, NativeSelect, Checkbox, CheckboxGroup, CheckboxCards, Radio, RadioGroup, RadioCards, Switch, Slider, Calendar, Label, Field, Form.",
    count: 21,
  },
  {
    icon: LayoutDashboardIcon,
    title: "Layout",
    description:
      "Sidebar, NavigationMenu, Breadcrumb, Separator, Resizable, ScrollArea, AspectRatio, Collapsible.",
    count: 8,
  },
  {
    icon: MousePointerClickIcon,
    title: "Actions",
    description: "Button, ButtonGroup, Toggle, ToggleGroup with multiple variants and sizes.",
    count: 4,
  },
  {
    icon: MessageSquareIcon,
    title: "Overlays",
    description:
      "Dialog, AlertDialog, Drawer, Sheet, Popover, Tooltip, DropdownMenu, ContextMenu, HoverCard, Menubar, Command.",
    count: 11,
  },
  {
    icon: MonitorIcon,
    title: "Data Display",
    description:
      "Table, Card, Badge, Avatar, Tabs, Accordion, Chart, Carousel, Pagination, Item, Kbd.",
    count: 11,
  },
  {
    icon: SparklesIcon,
    title: "Feedback",
    description: "Alert, Progress, ProgressCircle, Spinner, Skeleton, Sonner (toast), Empty.",
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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b px-6 py-24 md:py-32">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-0 left-1/2 h-125 w-200 -translate-x-1/2 rounded-full bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-sm">
            <PackageIcon className="size-3.5" />
            v0.3.9 — Open Source
          </Badge>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-foreground md:text-7xl">
            <span className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              @codefast/ui
            </span>
          </h1>

          <p className="mx-auto mb-4 max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl">
            A modern, accessible, and beautifully crafted React component library built with Radix
            UI and Tailwind CSS.
          </p>

          <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground/80">
            62 component modules. 6 custom hooks. 22 color themes. Dark mode. Full TypeScript
            support. Designed for the modern web.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/sink">
                Explore Components
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/theme">
                <PaletteIcon className="size-4" />
                Browse Themes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Install */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Get Started in Seconds
          </h2>
          <p className="text-lg text-muted-foreground">
            Install the package and start building beautiful interfaces.
          </p>
        </div>

        <div className="mx-auto max-w-xl space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">1. Install the package</p>
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3 font-mono text-sm">
              <code>pnpm add @codefast/ui</code>
              <CopyButton text="pnpm add @codefast/ui" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">2. Import the styles</p>
            <div className="space-y-1 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-sm">
              <div className="text-muted-foreground">{"/* globals.css */"}</div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">@import</span>{" "}
                <span className="text-green-600 dark:text-green-400">
                  &apos;@codefast/ui/css/preset.css&apos;
                </span>
                ;
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">@import</span>{" "}
                <span className="text-green-600 dark:text-green-400">
                  &apos;@codefast/ui/css/neutral.css&apos;
                </span>
                ;
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">3. Use the components</p>
            <div className="space-y-1 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-sm">
              <div>
                <span className="text-blue-600 dark:text-blue-400">import</span>
                {" { Button } "}
                <span className="text-blue-600 dark:text-blue-400">from</span>{" "}
                <span className="text-green-600 dark:text-green-400">
                  &apos;@codefast/ui/button&apos;
                </span>
                ;
              </div>
              <div className="mt-2">
                <span className="text-purple-600 dark:text-purple-400">{"<"}</span>
                <span className="text-blue-600 dark:text-blue-400">Button</span>
                <span className="text-purple-600 dark:text-purple-400">{">"}</span>
                Click me
                <span className="text-purple-600 dark:text-purple-400">{"</"}</span>
                <span className="text-blue-600 dark:text-blue-400">Button</span>
                <span className="text-purple-600 dark:text-purple-400">{">"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Why @codefast/ui?
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to build polished, production-ready applications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="border bg-card/50 transition-colors hover:border-blue-500/30"
            >
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Component Categories */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Component Library
          </h2>
          <p className="text-lg text-muted-foreground">
            A rich set of components organized into intuitive categories.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COMPONENT_CATEGORIES.map((category) => (
            <Card
              key={category.title}
              className="group cursor-default border bg-card/50 transition-all hover:border-purple-500/30 hover:shadow-md"
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                  <category.icon className="size-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{category.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
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

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/sink">
              <CodeIcon className="size-4" />
              View All Components
            </Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Theme Showcase */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Theming Made Simple
          </h2>
          <p className="text-lg text-muted-foreground">
            22 built-in color themes with light and dark mode. Switch themes with a single CSS
            import.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {[
            { name: "Neutral", color: "bg-neutral-500" },
            { name: "Slate", color: "bg-slate-500" },
            { name: "Zinc", color: "bg-zinc-500" },
            { name: "Stone", color: "bg-stone-500" },
            { name: "Gray", color: "bg-gray-500" },
            { name: "Red", color: "bg-red-500" },
            { name: "Orange", color: "bg-orange-500" },
            { name: "Amber", color: "bg-amber-500" },
            { name: "Yellow", color: "bg-yellow-500" },
            { name: "Lime", color: "bg-lime-500" },
            { name: "Green", color: "bg-green-500" },
            { name: "Emerald", color: "bg-emerald-500" },
            { name: "Teal", color: "bg-teal-500" },
            { name: "Cyan", color: "bg-cyan-500" },
            { name: "Sky", color: "bg-sky-500" },
            { name: "Blue", color: "bg-blue-500" },
            { name: "Indigo", color: "bg-indigo-500" },
            { name: "Violet", color: "bg-violet-500" },
            { name: "Purple", color: "bg-purple-500" },
            { name: "Fuchsia", color: "bg-fuchsia-500" },
            { name: "Pink", color: "bg-pink-500" },
            { name: "Rose", color: "bg-rose-500" },
          ].map((theme) => (
            <div
              key={theme.name}
              className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-sm"
            >
              <span className={`size-3 rounded-full ${theme.color}`} />
              <span className="text-muted-foreground">{theme.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <SunIcon className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Light</span>
          </div>
          <div className="flex items-center gap-2">
            <MoonIcon className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Dark</span>
          </div>
          <div className="flex items-center gap-2">
            <MonitorIcon className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">System</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/theme">
              <PaletteIcon className="size-4" />
              Explore Themes
            </Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Tech Stack */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Built On Modern Foundations
          </h2>
          <p className="text-lg text-muted-foreground">
            Standing on the shoulders of best-in-class libraries.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { name: "React 19", description: "UI Framework" },
            { name: "Radix UI", description: "Primitives" },
            { name: "Tailwind v4", description: "Styling" },
            { name: "TypeScript", description: "Type Safety" },
          ].map((tech) => (
            <div
              key={tech.name}
              className="flex flex-col items-center rounded-xl border bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50"
            >
              <span className="mb-1 text-sm font-semibold text-foreground">{tech.name}</span>
              <span className="text-xs text-muted-foreground">{tech.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
            Ready to Build?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Explore the component library, pick a theme, and start crafting your next project.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/sink">
                <CodeIcon className="size-4" />
                Component Showcase
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="gap-2">
              <a
                href="https://github.com/codefastlabs/codefast"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ArrowRightIcon className="size-4" />
              </a>
            </Button>
          </div>

          <p className="mt-12 text-sm text-muted-foreground/60">
            Made with care by{" "}
            <a
              href="https://github.com/codefastlabs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              codefastlabs
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
