import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { Progress } from "@codefast/ui/progress";
import { Separator } from "@codefast/ui/separator";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";

import { COMPONENTS } from "#/registry/components";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "codefast/ui — Beautiful, accessible React components for React 19" }],
  }),
  component: HomePage,
});

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    number: "01",
    title: "Radix UI primitives",
    description:
      "Every component is built on battle-tested Radix UI primitives. Keyboard navigation, ARIA attributes, and focus management are included — no configuration required.",
  },
  {
    number: "02",
    title: "Dark mode, zero config",
    description:
      "All tokens resolve automatically based on system preference or an explicit user choice. Drop in the CSS and dark mode works everywhere.",
  },
  {
    number: "03",
    title: "Tailwind CSS v4",
    description:
      "Components are unstyled HTML + Tailwind utility classes. Copy the source, customise to your brand — no wrapper components hiding your ability to adapt.",
  },
  {
    number: "04",
    title: "Strict TypeScript",
    description:
      "Full type inference on props, variants, and composition patterns. Catch mistakes at the editor, never at runtime. Every component ships with .d.ts files.",
  },
] as const;

// Derived from COMPONENTS — single source of truth in src/registry/components.ts
const COMPONENT_NAMES = COMPONENTS.map((c) => c.name);
const COMPONENT_COUNT = COMPONENTS.length;

/* -------------------------------------------------------------------------- */
/* Hero visual card                                                             */
/* -------------------------------------------------------------------------- */

function HeroCard() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-ui-border bg-ui-card shadow-2xl shadow-black/20 dark:shadow-black/60">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-ui-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="bg-ui-brand text-xs font-bold text-white">CF</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-ui-fg">Workspace settings</p>
            <p className="text-xs text-ui-muted">codefast/ui · Pro plan</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          Saved
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="p-5">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="general" className="flex-1 text-xs">
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 text-xs">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 text-xs">
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-0 space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-ui-muted">Notify email</Label>
            <Input type="email" defaultValue="you@company.com" />
          </div>

          <Separator />

          {/* Switches */}
          <div className="space-y-3">
            {[
              { label: "New deployments", defaultChecked: true },
              { label: "Security alerts", defaultChecked: true },
              { label: "Marketing emails", defaultChecked: false },
            ].map(({ label, defaultChecked }) => (
              <div key={label} className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <Switch defaultChecked={defaultChecked} className="scale-90" />
              </div>
            ))}
          </div>

          <Separator />

          {/* Storage */}
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-ui-muted">
              <span>Storage</span>
              <span>6.8 GB / 10 GB</span>
            </div>
            <Progress value={68} className="h-1" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-ui-muted">Workspace name</Label>
            <Input defaultValue="codefast/ui" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-ui-muted">Display URL</Label>
            <Input defaultValue="codefast.dev" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-start">
              <p className="text-xs font-medium text-ui-fg">Public profile</p>
              <p className="text-xs text-ui-muted">Show workspace in directory</p>
            </div>
            <Switch defaultChecked className="scale-90" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-0 space-y-4">
          <div className="rounded-lg border border-ui-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-ui-fg">Pro plan</p>
              <Badge className="text-xs">Active</Badge>
            </div>
            <p className="mb-2 text-xs text-ui-muted">Up to 10 seats · 10 GB storage</p>
            <p className="text-xs text-ui-muted">
              Next billing: <span className="text-ui-fg">Jun 1, 2026 · $49.00</span>
            </p>
          </div>
          <Separator />
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-ui-muted">
              <span>Seats used</span>
              <span>4 / 10</span>
            </div>
            <Progress value={40} className="h-1" />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm">
              Manage billing ›
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-16 px-4 pt-16 pb-20 text-center">
        <div className="animate-in duration-800 ease-out fill-mode-both fade-in slide-in-from-bottom-4">
          <h1
            className="mx-auto mb-5 max-w-4xl leading-none font-bold tracking-tighter text-ui-fg"
            style={{ fontSize: "clamp(56px, 8vw, 96px)" }}
          >
            Beautiful components
            <br />
            <span className="text-ui-brand">for React 19.</span>
          </h1>

          <p className="mx-auto max-w-md text-lg leading-relaxed text-ui-muted">
            {COMPONENT_COUNT}+ accessible components built on Radix UI and Tailwind CSS v4. Copy the source. Own the
            code.
          </p>

          <div className="mt-8 flex items-center justify-center gap-7">
            <Link to="/components" className="text-sm font-medium text-ui-brand no-underline hover:underline">
              Browse components ›
            </Link>
            <Link to="/about" className="text-sm text-ui-muted no-underline hover:text-ui-fg">
              Get started ›
            </Link>
          </div>
        </div>

        <div
          className="w-full max-w-sm animate-in duration-800 ease-out fill-mode-both fade-in slide-in-from-bottom-4"
          style={{ animationDelay: "120ms" }}
        >
          <HeroCard />
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────────────── */}
      {/* Inverted surface: black-on-white in light, white-on-dark in dark — */}
      {/* always maximal contrast against the page background in either theme. */}
      <section className="bg-ui-fg py-24 text-ui-inverse">
        <div className="container mx-auto px-4">
          {/* Stats — large numbers, no borders */}
          <div className="mb-20 grid grid-cols-3 gap-4 text-center">
            {[
              { value: `${COMPONENT_COUNT}+`, label: "components" },
              { value: "100%", label: "accessible" },
              { value: "0", label: "config files" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p
                  className="font-bold text-ui-inverse tabular-nums"
                  style={{ fontSize: "clamp(44px,6vw,80px)", letterSpacing: "-0.04em" }}
                >
                  {value}
                </p>
                <p className="mt-1 text-sm text-ui-brand">{label}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="mb-8 border-t border-ui-inverse/15" />

          {/* Component chips */}
          <p className="mb-6 text-center text-xs font-semibold tracking-widest text-ui-inverse/40 uppercase">
            everything in the box
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMPONENT_NAMES.map((name) => (
              <span
                key={name}
                className="rounded-full border border-ui-inverse/15 bg-ui-inverse/5 px-3 py-1 text-xs text-ui-inverse/60 transition-colors hover:border-ui-brand/50 hover:text-ui-inverse"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <h2
            className="mb-16 max-w-xl leading-none font-bold tracking-tighter text-ui-fg"
            style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
          >
            Built for the way
            <br />
            you actually work.
          </h2>

          <div className="divide-y divide-ui-border">
            {FEATURES.map(({ number, title, description }) => (
              <div key={title} className="grid gap-4 py-10 sm:grid-cols-[56px_1fr_1.5fr] sm:gap-10">
                <p className="font-mono text-sm text-ui-muted tabular-nums">{number}</p>
                <h3 className="text-base font-semibold text-ui-fg">{title}</h3>
                <p className="text-sm leading-relaxed text-ui-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install CTA ──────────────────────────────────────────────── */}
      <section className="bg-ui-fg py-24 text-ui-inverse sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2
            className="mx-auto mb-5 max-w-xl leading-none font-bold tracking-tighter text-ui-inverse"
            style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
          >
            One command to start.
          </h2>
          <p className="mx-auto mb-12 max-w-sm text-base text-ui-inverse/55">
            Tokens, dark mode, and accessibility come pre-configured.
          </p>

          <div className="mx-auto mb-8 w-fit rounded-xl border border-ui-inverse/15 bg-ui-inverse/10 px-7 py-3.5 font-mono text-sm text-ui-brand">
            <span className="me-2 opacity-40 select-none">$</span>
            pnpm add @codefast/ui
          </div>

          <Link to="/about" className="text-sm font-medium text-ui-inverse/60 no-underline hover:text-ui-inverse">
            Read the docs ›
          </Link>
        </div>
      </section>
    </main>
  );
}
