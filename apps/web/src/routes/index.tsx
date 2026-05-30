import { cn } from "@codefast/tailwind-variants";
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

// Derived from ALL_COMPONENTS — single source of truth in src/data/components.ts
const COMPONENT_NAMES = ALL_COMPONENTS.map((c) => c.name);
const COMPONENT_COUNT = ALL_COMPONENTS.length;

/* -------------------------------------------------------------------------- */
/* Hero visual card                                                             */
/* -------------------------------------------------------------------------- */

function HeroCard() {
  return (
    <div
      className={cn(
        "w-full max-w-sm overflow-hidden",
        "rounded-2xl border border-border",
        "bg-card shadow-2xl shadow-black/20",
        "dark:shadow-black/60",
      )}
    >
      {/* Card header */}
      <div
        className={cn("flex items-center justify-between", "px-5 py-4", "border-b border-border")}
      >
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-[10px] font-bold text-white">
              CF
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Workspace settings</p>
            <p className="text-[11px] text-muted-foreground">codefast/ui · Pro plan</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
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

        <TabsContent value="notifications" className={cn("space-y-4", "mt-0")}>
          {/* Email input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notify email</Label>
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
            <div
              className={cn("flex justify-between", "mb-1.5", "text-[11px] text-muted-foreground")}
            >
              <span>Storage</span>
              <span>6.8 GB / 10 GB</span>
            </div>
            <Progress value={68} className="h-1" />
          </div>

          {/* Actions */}
          <div className={cn("flex justify-end gap-2", "pt-1")}>
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="general" className={cn("space-y-4", "mt-0")}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Workspace name</Label>
            <Input defaultValue="codefast/ui" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Display URL</Label>
            <Input defaultValue="codefast.dev" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">Public profile</p>
              <p className="text-[11px] text-muted-foreground">Show workspace in directory</p>
            </div>
            <Switch defaultChecked className="scale-90" />
          </div>
          <div className={cn("flex justify-end gap-2", "pt-1")}>
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="billing" className={cn("space-y-4", "mt-0")}>
          <div className={cn("p-3", "rounded-lg border border-border")}>
            <div className={cn("flex items-center justify-between", "mb-2")}>
              <p className="text-xs font-semibold text-foreground">Pro plan</p>
              <Badge className="text-[10px]">Active</Badge>
            </div>
            <p className={cn("mb-2", "text-[11px] text-muted-foreground")}>
              Up to 10 seats · 10 GB storage
            </p>
            <p className="text-[11px] text-muted-foreground">
              Next billing: <span className="text-foreground">Jun 1, 2026 · $49.00</span>
            </p>
          </div>
          <Separator />
          <div>
            <div
              className={cn("flex justify-between", "mb-1.5", "text-[11px] text-muted-foreground")}
            >
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
        <div
          className={cn(
            "fill-mode-both",
            "animate-in duration-800 ease-out",
            "fade-in slide-in-from-bottom-4",
          )}
        >
          <h1
            className={cn(
              "mx-auto mb-5 max-w-4xl",
              "leading-[1.02] font-bold tracking-[-0.045em] text-foreground",
            )}
            style={{ fontSize: "clamp(56px, 8vw, 96px)" }}
          >
            Beautiful components
            <br />
            <span className="text-primary">for React 19.</span>
          </h1>

          <p
            className={cn("mx-auto max-w-md", "text-[18px] leading-relaxed text-muted-foreground")}
          >
            {COMPONENT_COUNT}+ accessible components built on Radix UI and Tailwind CSS v4. Copy the
            source. Own the code.
          </p>

          <div className={cn("flex items-center justify-center gap-7", "mt-8")}>
            <Link
              to="/components"
              className={cn("text-[15px] font-medium text-primary no-underline", "hover:underline")}
            >
              Browse components ›
            </Link>
            <Link
              to="/about"
              className={cn(
                "text-[15px] text-muted-foreground no-underline",
                "hover:text-foreground",
              )}
            >
              Get started ›
            </Link>
          </div>
        </div>

        <div
          className={cn(
            "w-full max-w-sm",
            "fill-mode-both",
            "animate-in duration-800 ease-out",
            "fade-in slide-in-from-bottom-4",
          )}
          style={{ animationDelay: "120ms" }}
        >
          <HeroCard />
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────────────── */}
      {/* Inverted surface: black-on-white in light, white-on-dark in dark — */}
      {/* always maximal contrast against the page background in either theme. */}
      <section className={cn("py-24", "bg-foreground text-background")}>
        <div className={cn("container", "mx-auto px-4")}>
          {/* Stats — large numbers, no borders */}
          <div className={cn("grid grid-cols-3 gap-4", "mb-20", "text-center")}>
            {[
              { value: `${COMPONENT_COUNT}+`, label: "components" },
              { value: "100%", label: "accessible" },
              { value: "0", label: "config files" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p
                  className="font-bold text-background tabular-nums"
                  style={{ fontSize: "clamp(44px,6vw,80px)", letterSpacing: "-0.04em" }}
                >
                  {value}
                </p>
                <p className={cn("mt-1", "text-sm text-primary")}>{label}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className={cn("mb-8", "border-t border-background/15")} />

          {/* Component chips */}
          <p
            className={cn(
              "mb-6",
              "text-center text-[11px] font-semibold tracking-widest text-background/40 uppercase",
            )}
          >
            everything in the box
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMPONENT_NAMES.map((name) => (
              <span
                key={name}
                className={cn(
                  "px-3 py-1",
                  "rounded-full border border-background/15",
                  "bg-background/5 text-xs text-background/60",
                  "transition-colors",
                  "hover:border-primary/50 hover:text-background",
                )}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className={cn("py-24", "sm:py-32")}>
        <div className={cn("container", "mx-auto px-4")}>
          <h2
            className={cn(
              "mb-16 max-w-xl",
              "leading-[1.05] font-bold tracking-[-0.035em] text-foreground",
            )}
            style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
          >
            Built for the way
            <br />
            you actually work.
          </h2>

          <div className="divide-y divide-border">
            {FEATURES.map(({ number, title, description }) => (
              <div
                key={title}
                className={cn("grid gap-4", "py-10", "sm:grid-cols-[56px_1fr_1.5fr] sm:gap-10")}
              >
                <p className="font-mono text-sm text-muted-foreground tabular-nums">{number}</p>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install CTA ──────────────────────────────────────────────── */}
      <section className={cn("py-24", "bg-foreground text-background", "sm:py-32")}>
        <div className={cn("container", "mx-auto px-4", "text-center")}>
          <h2
            className={cn(
              "mx-auto mb-5 max-w-xl",
              "leading-[1.05] font-bold tracking-[-0.035em] text-background",
            )}
            style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
          >
            One command to start.
          </h2>
          <p className={cn("mx-auto mb-12 max-w-sm", "text-[17px] text-background/55")}>
            Tokens, dark mode, and accessibility come pre-configured.
          </p>

          <div
            className={cn(
              "mx-auto mb-8 w-fit px-7 py-3.5",
              "rounded-xl border border-background/15",
              "bg-background/10 font-mono text-sm text-primary",
            )}
          >
            <span className={cn("mr-2", "opacity-40", "select-none")}>$</span>
            pnpm add @codefast/ui
          </div>

          <Link
            to="/about"
            className={cn(
              "text-[15px] font-medium text-background/60 no-underline",
              "hover:text-background",
            )}
          >
            Read the docs ›
          </Link>
        </div>
      </section>
    </main>
  );
}
