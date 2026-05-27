import { createFileRoute, Link } from "@tanstack/react-router";
import { ALL_COMPONENTS } from "#/data/components";
import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { Progress } from "@codefast/ui/progress";
import { Separator } from "@codefast/ui/separator";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

export const Route = createFileRoute("/")({ component: HomePage });

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

// Derived from ALL_COMPONENTS — single source of truth in src/data/components.ts
const COMPONENT_NAMES = ALL_COMPONENTS.map((c) => c.name);

/* -------------------------------------------------------------------------- */
/* Hero visual card                                                             */
/* -------------------------------------------------------------------------- */

function HeroCard() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-(--line) bg-(--surface) shadow-2xl shadow-black/20 dark:shadow-black/60">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-(--line) px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="bg-(--lagoon) text-[10px] font-bold text-white">
              CF
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[13px] font-semibold text-(--sea-ink)">Workspace settings</p>
            <p className="text-[11px] text-(--sea-ink-soft)">codefast/ui · Pro plan</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          Saved
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="p-5">
        <TabsList className="mb-4 h-8 w-full">
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
            <Label className="text-xs text-(--sea-ink-soft)">Notify email</Label>
            <Input type="email" defaultValue="you@company.com" className="h-8 text-xs" />
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
            <div className="mb-1.5 flex justify-between text-[11px] text-(--sea-ink-soft)">
              <span>Storage</span>
              <span>6.8 GB / 10 GB</span>
            </div>
            <Progress value={68} className="h-1" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Discard
            </Button>
            <Button size="sm" className="h-7 text-xs">
              Save changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-(--sea-ink-soft)">Workspace name</Label>
            <Input defaultValue="codefast/ui" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-(--sea-ink-soft)">Display URL</Label>
            <Input defaultValue="codefast.dev" className="h-8 text-xs" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-(--sea-ink)">Public profile</p>
              <p className="text-[11px] text-(--sea-ink-soft)">Show workspace in directory</p>
            </div>
            <Switch defaultChecked className="scale-90" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Discard
            </Button>
            <Button size="sm" className="h-7 text-xs">
              Save changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-0 space-y-4">
          <div className="rounded-lg border border-(--line) p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-(--sea-ink)">Pro plan</p>
              <Badge className="text-[10px]">Active</Badge>
            </div>
            <p className="mb-2 text-[11px] text-(--sea-ink-soft)">Up to 10 seats · 10 GB storage</p>
            <p className="text-[11px] text-(--sea-ink-soft)">
              Next billing: <span className="text-(--sea-ink)">Jun 1, 2026 · $49.00</span>
            </p>
          </div>
          <Separator />
          <div>
            <div className="mb-1.5 flex justify-between text-[11px] text-(--sea-ink-soft)">
              <span>Seats used</span>
              <span>4 / 10</span>
            </div>
            <Progress value={40} className="h-1" />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-7 text-xs">
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
        <div className="rise-in">
          <h1
            className="mx-auto mb-5 max-w-4xl leading-[1.02] font-bold tracking-[-0.045em] text-(--sea-ink)"
            style={{ fontSize: "clamp(56px, 8vw, 96px)" }}
          >
            Beautiful components
            <br />
            <span className="bg-linear-to-br from-(--lagoon) to-(--lagoon-deep) bg-clip-text text-transparent">
              for React 19.
            </span>
          </h1>

          <p className="mx-auto max-w-md text-[18px] leading-relaxed text-(--sea-ink-soft)">
            60+ accessible components built on Radix UI and Tailwind CSS v4. Copy the source. Own
            the code.
          </p>

          <div className="mt-8 flex items-center justify-center gap-7">
            <Link
              to="/components"
              className="text-[15px] font-medium text-(--lagoon) no-underline hover:underline"
            >
              Browse components ›
            </Link>
            <Link
              to="/about"
              className="text-[15px] text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)"
            >
              Get started ›
            </Link>
          </div>
        </div>

        <div className="rise-in w-full max-w-sm" style={{ animationDelay: "120ms" }}>
          <HeroCard />
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────────────── */}
      <section className="dark-band px-4 py-24">
        <div className="page-wrap">
          {/* Stats — large numbers, no borders */}
          <div className="mb-20 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "60+", label: "components" },
              { value: "100%", label: "accessible" },
              { value: "0", label: "config files" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p
                  className="font-bold text-white tabular-nums"
                  style={{ fontSize: "clamp(44px,6vw,80px)", letterSpacing: "-0.04em" }}
                >
                  {value}
                </p>
                <p className="mt-1 text-sm text-(--lagoon)">{label}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="mb-8 border-t border-white/10" />

          {/* Component chips */}
          <p className="mb-6 text-center text-[11px] font-semibold tracking-widest text-white/30 uppercase">
            everything in the box
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMPONENT_NAMES.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-[#a1a1a6] transition-colors hover:border-(--lagoon)/40 hover:text-white"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:py-32">
        <div className="page-wrap">
          <h2
            className="display-title mb-16 max-w-xl font-bold text-(--sea-ink)"
            style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
          >
            Built for the way
            <br />
            you actually work.
          </h2>

          <div className="divide-y divide-(--line)">
            {FEATURES.map(({ number, title, description }) => (
              <div key={title} className="grid gap-4 py-10 sm:grid-cols-[56px_1fr_1.5fr] sm:gap-10">
                <p className="font-mono text-sm text-(--sea-ink-soft) tabular-nums">{number}</p>
                <h3 className="text-base font-semibold text-(--sea-ink)">{title}</h3>
                <p className="text-[15px] leading-relaxed text-(--sea-ink-soft)">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install CTA ──────────────────────────────────────────────── */}
      <section className="dark-band px-4 py-24 sm:py-32">
        <div className="page-wrap text-center">
          <h2
            className="display-title mx-auto mb-5 max-w-xl font-bold text-white"
            style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
          >
            One command to start.
          </h2>
          <p className="mx-auto mb-12 max-w-sm text-[17px] text-white/50">
            Tokens, dark mode, and accessibility come pre-configured.
          </p>

          <div className="mx-auto mb-8 w-fit rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 font-mono text-sm text-(--lagoon)">
            <span className="mr-2 opacity-30 select-none">$</span>
            pnpm add @codefast/ui
          </div>

          <Link
            to="/about"
            className="text-[15px] font-medium text-white/60 no-underline hover:text-white"
          >
            Read the docs ›
          </Link>
        </div>
      </section>
    </main>
  );
}
