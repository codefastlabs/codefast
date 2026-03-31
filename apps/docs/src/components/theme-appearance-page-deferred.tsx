import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { Separator } from "@codefast/ui/separator";
import { ShikiThemeCodeBlock } from "#components/shiki-theme-code-block";
import {
  PNPM_INSTALL,
  TANSTACK_ROOT_SNIPPET,
  USE_THEME_TOGGLE_SNIPPET,
} from "#components/theme-appearance-constants";
import { CopySnippetButton } from "#components/theme-appearance-shared";
import { cn } from "@codefast/tailwind-variants";
import { themes, type ResolvedTheme, type Theme } from "@codefast/theme";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CodeIcon,
  InfoIcon,
  LaptopIcon,
  LayersIcon,
  MoonIcon,
  PackageIcon,
  PaletteIcon,
  SunIcon,
} from "lucide-react";
import type { JSX } from "react";
import { lazy, Suspense } from "react";

const ThemeLibraryPreview = lazy(() =>
  import("#components/theme-library-preview").then((m) => ({ default: m.ThemeLibraryPreview })),
);

function ThemeCodeBlock({
  title,
  code,
  lang = "tsx",
}: {
  title: string;
  code: string;
  lang?: "tsx" | "typescript" | "bash";
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <div className="flex items-start justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-3 shadow-inner sm:text-xs">
        <ShikiThemeCodeBlock code={code} lang={lang} />
        <CopySnippetButton text={code} />
      </div>
    </div>
  );
}

function ThemeTransitionSamplesGrid({ variant }: { variant: "inline" | "full" }) {
  const inline = variant === "inline";

  return (
    <div
      className={cn(
        "grid",
        inline ? "grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2" : "gap-4 md:grid-cols-3",
      )}
    >
      <Card
        className={cn(
          "border-border/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-lg",
          inline && "shadow-sm",
        )}
      >
        <CardHeader className={cn(!inline && "pb-2", inline && "space-y-0 p-3 pb-1")}>
          <CardTitle className={cn("text-sm", inline && "text-xs")}>Card</CardTitle>
        </CardHeader>
        <CardContent className={cn(inline && "p-3 pt-0")}>
          <p
            className={cn("text-xs text-muted-foreground", inline && "text-[0.65rem] leading-snug")}
          >
            {inline
              ? "Hover scales; mode change snaps colors."
              : "Hover for scale and shadow; mode changes stay instant."}
          </p>
        </CardContent>
      </Card>

      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-border/60 bg-card/90 transition-all duration-500 hover:bg-accent",
          inline ? "min-h-[4.25rem] p-2 sm:min-h-[4.5rem] sm:p-3" : "min-h-[8.5rem] p-4",
        )}
      >
        <Button size={inline ? "sm" : "md"} className="transition-all duration-500 hover:scale-105">
          Button
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/90 transition-all duration-500 hover:border-primary",
          inline ? "min-h-[4.25rem] p-2 sm:min-h-[4.5rem] sm:p-3" : "min-h-[8.5rem] p-4",
        )}
      >
        <Badge className="transition-all duration-500 hover:scale-105">Badge</Badge>
      </div>
    </div>
  );
}

function ThemeSectionHeader({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="mb-6 max-w-2xl md:mb-8">
      <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
        {eyebrow}
      </p>
      <h2 id={id} className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground md:text-base">
        {description}
      </p>
    </div>
  );
}
function TanStackThemeSetupCollapsible() {
  return (
    <section
      id="tanstack-theme-setup"
      aria-labelledby="tanstack-setup-title"
      className="scroll-mt-24 md:scroll-mt-28"
    >
      <Collapsible defaultOpen={false} className="group/collapsible">
        <Card className="overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-muted/20 shadow-md ring-1 ring-border/40">
          <CardHeader className="flex flex-col gap-4 space-y-0 border-b border-border/40 bg-muted/15 pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15">
                <CodeIcon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle id="tanstack-setup-title" className="text-lg md:text-xl">
                  TanStack Start + @codefast/theme
                </CardTitle>
                <CardDescription className="text-pretty">
                  Cookie-backed light, dark, and system for TanStack Start: SSR reads the
                  preference,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                    {"<html>"}
                  </code>{" "}
                  matches the first paint, and any route can use{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                    useTheme()
                  </code>
                  .
                </CardDescription>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Open the panel below for install, ordered steps, copy-paste{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[0.65rem] text-foreground">
                    __root.tsx
                  </code>
                  , and a toggle example.
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full shrink-0 gap-2 shadow-sm sm:w-auto"
                aria-controls="tanstack-setup-panel"
              >
                <span className="group-data-[state=open]/collapsible:hidden">Show setup guide</span>
                <span className="hidden group-data-[state=open]/collapsible:inline">
                  Hide setup guide
                </span>
                <ChevronDownIcon
                  className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                  aria-hidden
                />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent id="tanstack-setup-panel">
            <CardContent className="space-y-8 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Outcome</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-foreground" aria-hidden>
                      •
                    </span>
                    <span>
                      Preference survives full page reloads (HTTP-only cookie set by a TanStack
                      Start server function).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground" aria-hidden>
                      •
                    </span>
                    <span>
                      <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                        ThemeScript
                      </code>{" "}
                      aligns the first paint with the cookie before React hydrates.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground" aria-hidden>
                      •
                    </span>
                    <span>
                      <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                        useTheme()
                      </code>{" "}
                      exposes{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                        setTheme
                      </code>
                      , stored value, and OS-resolved mode for UI.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Install</h3>
                <div className="mt-2 flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 shadow-inner">
                  <ShikiThemeCodeBlock
                    code={PNPM_INSTALL}
                    lang="bash"
                    className="[&_pre]:max-h-none"
                  />
                  <CopySnippetButton text={PNPM_INSTALL} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  npm / yarn equivalent works. You still need global CSS from{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[0.65rem] text-foreground">
                    @codefast/ui
                  </code>{" "}
                  (preset + palette) as in the home page install snippet.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Implementation steps</h3>
                <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-muted-foreground marker:font-semibold marker:text-foreground">
                  <li>
                    <span className="font-medium text-foreground">Root route loader</span> — Call{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      getThemeServerFn()
                    </code>{" "}
                    and return{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      theme
                    </code>{" "}
                    so the value is available during SSR and on the client after navigation.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Shell component</span> — Use{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      shellComponent
                    </code>{" "}
                    (not the default route component) to render the full document: apply{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      className=&#123;resolveTheme(theme)&#125;
                    </code>{" "}
                    and{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      style=&#123;&#123; colorScheme: resolveTheme(theme) &#125;&#125;
                    </code>{" "}
                    on{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      {"<html>"}
                    </code>
                    .
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Head</span> — Render{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      HeadContent
                    </code>{" "}
                    for the framework, then{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      ThemeScript theme=&#123;theme&#125;
                    </code>
                    .
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Body</span> — Wrap the app with{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      ThemeProvider
                    </code>{" "}
                    using the loader&apos;s{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      theme
                    </code>{" "}
                    and{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      persistTheme=&#123;persistThemeCookie&#125;
                    </code>
                    ,{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      syncThemeFromServer=&#123;getThemeServerFn&#125;
                    </code>{" "}
                    (avoids stale theme when duplicating a tab after another tab changed the
                    cookie), or{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      (v) =&gt; setThemeServerFn(&#123; data: v &#125;)
                    </code>
                    ). Include{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      Scripts
                    </code>{" "}
                    after children.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Toggles</span> — Import{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      useTheme
                    </code>{" "}
                    from{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      @codefast/theme
                    </code>{" "}
                    in any client component and call{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                      setTheme
                    </code>
                    .
                  </li>
                </ol>
              </div>

              <ThemeCodeBlock
                title="Example: __root.tsx (replace YourRouterContext with your createRootRouteWithContext type)"
                code={TANSTACK_ROOT_SNIPPET}
              />

              <ThemeCodeBlock title="Example: toggle component" code={USE_THEME_TOGGLE_SNIPPET} />

              <div>
                <h3 className="text-sm font-semibold text-foreground">Persistence details</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                    persistThemeCookie
                  </code>{" "}
                  calls the Start adapter&apos;s POST server function, which sets an HTTP-only
                  cookie (see{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                    setThemeServerFn
                  </code>{" "}
                  in the package). The browser cannot read that cookie from JS; only the server
                  reads it on the next request via{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                    getThemeServerFn
                  </code>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Sanity check</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-foreground" aria-hidden>
                      •
                    </span>
                    <span>Toggle mode, hard refresh—UI should match the last choice.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground" aria-hidden>
                      •
                    </span>
                    <span>
                      Open two tabs on the same origin; changing one should sync the other.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground" aria-hidden>
                      •
                    </span>
                    <span>
                      If the page flashes the wrong mode once, confirm{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                        ThemeScript
                      </code>{" "}
                      is in{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                        {"<head>"}
                      </code>{" "}
                      and the shell applies{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                        resolveTheme
                      </code>{" "}
                      on{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                        {"<html>"}
                      </code>
                      .
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/40 pt-6">
                <Button asChild variant="outline" size="sm">
                  <a
                    href="https://github.com/codefastlabs/codefast/blob/main/apps/docs/src/routes/__root.tsx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Reference: __root.tsx in this repo
                  </a>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <a
                    href="https://tanstack.com/start/latest/docs/framework/react/server-functions"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    TanStack Start — server functions
                  </a>
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </section>
  );
}

const TOKEN_SWATCHES: { label: string; varName: string; note?: string }[] = [
  { label: "Background", varName: "--background" },
  { label: "Foreground", varName: "--foreground" },
  { label: "Primary", varName: "--primary" },
  { label: "Primary text", varName: "--primary-foreground", note: "On primary surfaces" },
  { label: "Muted", varName: "--muted" },
  { label: "Muted text", varName: "--muted-foreground" },
  { label: "Accent", varName: "--accent" },
  { label: "Destructive", varName: "--destructive" },
  { label: "Border", varName: "--border" },
  { label: "Card", varName: "--card" },
];

function TokenSwatch({ label, varName, note }: { label: string; varName: string; note?: string }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-md">
      <div
        className="h-16 w-full border-b border-border/40"
        style={{ backgroundColor: `var(${varName})` }}
        aria-hidden
      />
      <div className="p-3.5">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <code className="mt-0.5 block font-mono text-[0.65rem] text-muted-foreground">
          {varName}
        </code>
        {note ? (
          <p className="mt-1.5 text-[0.65rem] leading-snug text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

export interface ThemeAppearancePageDeferredProps {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (value: Theme) => Promise<void>;
}

export function ThemeAppearancePageDeferred({
  theme,
  resolvedTheme,
  setTheme,
}: ThemeAppearancePageDeferredProps): JSX.Element {
  return (
    <div className="mx-auto max-w-[1400px] space-y-10 px-4 py-12 sm:px-6 md:space-y-14 md:py-16">
      <ThemeSectionHeader
        eyebrow="Controls"
        id="playground-heading"
        title="Appearance & state"
        description="Exercise the same light/dark/system flow your users get from @codefast/theme: document class, cookie persistence, and live useTheme() values."
      />

      <div className="rounded-[1.75rem] border border-border/50 bg-muted/15 p-4 shadow-inner ring-1 ring-border/30 md:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-12">
          <Card className="border-border/60 bg-card/95 shadow-md ring-1 ring-border/35 md:col-span-12 lg:col-span-5 lg:row-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <PaletteIcon className="size-5" aria-hidden />
                </span>
                Color mode
              </CardTitle>
              <CardDescription>
                Light, dark, or system (follow the OS). Updates the document{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                  class
                </code>{" "}
                so Tailwind{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                  dark:
                </code>{" "}
                variants line up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-1.5 sm:rounded-2xl sm:bg-muted/50 sm:p-1.5">
                {themes.map((themeOption) => {
                  const isActive = theme === themeOption;
                  const Icon =
                    themeOption === "light"
                      ? SunIcon
                      : themeOption === "dark"
                        ? MoonIcon
                        : LaptopIcon;

                  return (
                    <Button
                      key={themeOption}
                      variant={isActive ? "default" : "ghost"}
                      size="lg"
                      onClick={() => setTheme(themeOption)}
                      className={`h-12 w-full justify-center gap-2 sm:h-11 sm:rounded-xl ${isActive ? "shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="capitalize">{themeOption}</span>
                      {isActive ? (
                        <CheckCircle2Icon className="size-4 shrink-0" aria-hidden />
                      ) : null}
                    </Button>
                  );
                })}
              </div>

              <Separator className="bg-border/60" />

              <div
                className="rounded-2xl border border-dashed border-primary/25 bg-linear-to-b from-muted/40 to-muted/10 p-3 ring-1 ring-primary/10"
                aria-label="Samples for mode changes and hover transitions"
              >
                <p className="text-xs font-semibold text-foreground">Mode change vs hover motion</p>
                <p className="mt-1 text-[0.7rem] leading-snug text-pretty text-muted-foreground">
                  A new appearance applies to surfaces right away. Hover transitions on these
                  samples are independent—use them to confirm both behaviors.
                </p>
                <div className="mt-3">
                  <ThemeTransitionSamplesGrid variant="inline" />
                </div>
                <div className="mt-3 border-t border-border/40 pt-3">
                  <Link
                    to="."
                    hash="motion-lab-full"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Extended samples ↓
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/95 shadow-sm ring-1 ring-border/30 md:col-span-6 lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Current state</CardTitle>
              <CardDescription>
                Values from <code className="font-mono text-xs">useTheme()</code> in{" "}
                <code className="font-mono text-xs">@codefast/theme</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Preference</span>
                <Badge variant="outline" className="capitalize">
                  {theme}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Resolved</span>
                <Badge
                  variant={resolvedTheme === "dark" ? "secondary" : "outline"}
                  className="capitalize"
                >
                  {resolvedTheme}
                </Badge>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Modes</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {themes.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs capitalize">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/95 shadow-sm ring-1 ring-border/30 md:col-span-6 lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
                <PackageIcon className="size-4 text-primary" aria-hidden />
              </div>
              <CardTitle className="text-base">Scope of this package</CardTitle>
              <CardDescription className="text-pretty">
                <code className="font-mono text-xs">@codefast/theme</code> is headless: no widgets,
                no CSS preset. This docs site also uses{" "}
                <code className="font-mono text-xs">@codefast/ui</code> for layout and demos — brand
                accent files live there, not here.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Mode vs palette — spans under state+cta on lg */}
          <div className="grid gap-4 md:col-span-12 md:grid-cols-2 lg:col-span-7 lg:col-start-6 lg:row-start-2">
            <Card className="border-border/60 bg-card/90 shadow-sm ring-1 ring-border/25 transition-colors hover:ring-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/12 text-amber-800 dark:text-amber-300">
                    <SunIcon className="size-4" aria-hidden />
                  </span>
                  Appearance mode
                </CardTitle>
                <CardDescription className="text-pretty">
                  Stored preference + resolved light/dark. Handled by{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[0.7rem] text-foreground">
                    @codefast/theme
                  </code>{" "}
                  (cookie, SSR script, tab sync).
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/60 bg-card/90 shadow-sm ring-1 ring-border/25 transition-colors hover:ring-violet-400/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/12 text-violet-800 dark:text-violet-300">
                    <LayersIcon className="size-4" aria-hidden />
                  </span>
                  Brand colors (@codefast/ui)
                </CardTitle>
                <CardDescription className="text-pretty">
                  Accent CSS (e.g.{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[0.7rem] text-foreground">
                    neutral.css
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[0.7rem] text-foreground">
                    blue.css
                  </code>
                  ) ships with the UI kit. Orthogonal to light/dark/system from @codefast/theme.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      <TanStackThemeSetupCollapsible />

      {/* Semantic tokens */}
      <section aria-labelledby="tokens-heading">
        <ThemeSectionHeader
          eyebrow="Design tokens"
          id="tokens-heading"
          title="Semantic colors"
          description="On this site, semantic colors come from the docs CSS (e.g. @codefast/ui palettes). Switching mode here shows how @codefast/theme drives light/dark while those variables update underneath."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TOKEN_SWATCHES.map((t) => (
            <TokenSwatch key={t.varName} label={t.label} varName={t.varName} note={t.note} />
          ))}
        </div>
      </section>

      <ThemeSectionHeader
        eyebrow="Behavior"
        id="behavior-heading"
        title="What this app wires for you"
        description="The same defaults ship with the TanStack Start adapter: cookie persistence, SSR script, and smooth handoff to Tailwind tokens."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm ring-1 ring-border/25">
          <CheckCircle2Icon
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Light, dark, and system (follow OS) modes.
          </p>
        </div>
        <div className="flex gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm ring-1 ring-border/25">
          <CheckCircle2Icon
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Persisted preference (cookie) with SSR-friendly script to limit flash.
          </p>
        </div>
        <div className="flex gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm ring-1 ring-border/25">
          <CheckCircle2Icon
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tab sync and sensible{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
              color-scheme
            </code>{" "}
            on the document.
          </p>
        </div>
        <div className="flex gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm ring-1 ring-border/25">
          <CheckCircle2Icon
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
              disableTransitionOnChange
            </code>{" "}
            on{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
              ThemeProvider
            </code>{" "}
            to avoid long cross-fades when swapping modes.
          </p>
        </div>
      </div>

      <section
        id="motion-lab-full"
        aria-labelledby="transitions-heading"
        className="scroll-mt-24 md:scroll-mt-28"
      >
        <ThemeSectionHeader
          eyebrow="Motion"
          id="transitions-heading"
          title="Transitions & mode switches"
          description="Larger samples and a slow-hover panel. Use them to confirm appearance updates apply immediately while hover-driven motion on controls still behaves normally."
        />
        <Card className="overflow-hidden border-border/60 shadow-md ring-1 ring-border/35">
          <CardContent className="space-y-6 p-6 md:p-8">
            <Alert className="border-primary/20 bg-primary/5">
              <InfoIcon className="size-4 text-primary" aria-hidden />
              <AlertTitle>Expected behavior</AlertTitle>
              <AlertDescription className="block text-pretty text-foreground">
                While the document appearance changes, transition suppression avoids blending
                through unintended intermediate colors. Hover and focus transitions on UI components
                are unchanged.
              </AlertDescription>
            </Alert>

            <ThemeTransitionSamplesGrid variant="full" />

            <div className="rounded-2xl border border-border/60 bg-linear-to-r from-primary/12 via-secondary/8 to-transparent p-6 transition-all duration-700 hover:from-primary/18">
              <h3 className="mb-1 text-sm font-semibold text-foreground">Long hover transition</h3>
              <p className="text-xs text-muted-foreground">
                700ms on hover; theme toggles should never “fade” through odd in-between colors.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="preview-heading">
        <ThemeSectionHeader
          eyebrow="Optional context"
          id="preview-heading"
          title="@codefast/ui samples"
          description="Only for this documentation site: see how light/dark/system from @codefast/theme affects real components. The package itself stays headless."
        />
        <Suspense
          fallback={
            <div
              className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-border/50 bg-muted/20"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm text-muted-foreground">Loading samples…</p>
            </div>
          }
        >
          <ThemeLibraryPreview />
        </Suspense>
      </section>

      <Card className="border-border/60 bg-muted/20 shadow-sm ring-1 ring-border/30">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/50">
              <InfoIcon className="size-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-foreground">How it fits together</p>
              <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">
                <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                  @codefast/theme
                </code>{" "}
                keeps the preference and document class. Tailwind and the UI preset supply{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">
                  dark:
                </code>{" "}
                and CSS variables. Accent palettes come from a stylesheet import—see the home page
                install snippet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
