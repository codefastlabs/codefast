import { cn } from "@codefast/tailwind-variants";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Separator } from "@codefast/ui/separator";
import { PNPM_INSTALL } from "#components/theme-appearance-constants";
import { CopySnippetButton } from "#components/theme-appearance-shared";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, CodeIcon, SparklesIcon } from "lucide-react";
import type { JSX } from "react";
import { lazy, Suspense } from "react";
import { useTheme } from "@codefast/theme";

const ThemeAppearancePageDeferred = lazy(() =>
  import("#components/theme-appearance-page-deferred").then((m) => ({
    default: m.ThemeAppearancePageDeferred,
  })),
);

function ThemePackageInstallStrip() {
  return (
    <section
      id="theme-package-install"
      className={cn(
        "py-8",
        "border-b border-border/60 bg-muted/10",
        "md:scroll-mt-28",
        "scroll-mt-24",
      )}
      aria-labelledby="theme-package-install-heading"
    >
      <div
        className={cn(
          "flex max-w-[1400px] flex-col gap-4",
          "mx-auto px-4",
          "sm:flex-row sm:items-center sm:justify-between sm:px-6",
        )}
      >
        <div className="min-w-0">
          <h2
            id="theme-package-install-heading"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Install{" "}
            <span className="font-mono text-xs font-normal text-muted-foreground">
              @codefast/theme
            </span>
          </h2>
          <p className={cn("max-w-xl", "mt-1", "text-xs leading-relaxed text-muted-foreground")}>
            Persisted light, dark, and system appearance, SSR-friendly first paint, and an optional
            TanStack Start adapter — see the integration guide below for wiring.
          </p>
        </div>
        <div
          className={cn(
            "flex w-full max-w-full min-w-0 items-center justify-between gap-3",
            "px-4 py-3",
            "rounded-xl border border-border/60 bg-card shadow-sm",
            "font-mono text-sm",
            "sm:w-auto sm:max-w-md",
          )}
        >
          <code className="truncate text-foreground">{PNPM_INSTALL}</code>
          <CopySnippetButton text={PNPM_INSTALL} />
        </div>
      </div>
    </section>
  );
}

export function ThemeAppearancePage(): JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className={cn("min-h-screen", "bg-background")}>
      <div className={cn("relative overflow-hidden", "border-b border-border/80")}>
        <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] mask-[radial-gradient(ellipse_85%_65%_at_50%_-15%,#000_45%,transparent_100%)] bg-size-[2.5rem_2.5rem]",
            "pointer-events-none",
            "dark:bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)]",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-linear-to-b from-primary/[0.07] via-transparent to-transparent",
            "pointer-events-none",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute h-72 w-72",
            "-top-24 right-0",
            "rounded-full bg-linear-to-br from-primary/20 via-violet-500/10 to-transparent blur-3xl",
            "pointer-events-none",
            "md:right-[10%]",
            "dark:from-primary/25",
          )}
          aria-hidden
        />
        <div className={cn("relative max-w-[1400px]", "mx-auto px-4 py-14", "sm:px-6", "md:py-20")}>
          <div
            className={cn(
              "grid items-center gap-12",
              "lg:grid-cols-[1fr_min(24rem,100%)] lg:gap-16",
            )}
          >
            <div>
              <p
                className={cn(
                  "mb-3",
                  "text-xs font-semibold tracking-[0.2em] text-primary uppercase",
                )}
              >
                Appearance
              </p>
              <h1
                className={cn(
                  "mb-5",
                  "text-4xl font-extrabold tracking-tight text-foreground",
                  "md:text-5xl",
                  "lg:text-6xl",
                )}
              >
                Theme &amp;{" "}
                <span
                  className={cn(
                    "bg-linear-to-r from-primary to-violet-600 bg-clip-text",
                    "text-transparent",
                    "dark:from-primary dark:to-fuchsia-400",
                  )}
                >
                  color mode
                </span>
              </h1>
              <p
                className={cn(
                  "max-w-xl",
                  "text-lg leading-relaxed text-pretty text-muted-foreground",
                  "md:text-xl",
                )}
              >
                <code
                  className={cn(
                    "px-1.5 py-0.5",
                    "rounded bg-muted",
                    "font-mono text-[0.9em] text-foreground",
                  )}
                >
                  @codefast/theme
                </code>{" "}
                persists light, dark, or system, aligns the first paint with SSR, and exposes{" "}
                <code
                  className={cn(
                    "px-1.5 py-0.5",
                    "rounded bg-muted",
                    "font-mono text-[0.9em] text-foreground",
                  )}
                >
                  useTheme()
                </code>{" "}
                everywhere in your app. Wire TanStack Start with the integration panel further down.
              </p>
              <div className={cn("flex flex-wrap gap-3", "mt-8")}>
                <Button asChild size="md" className={cn("gap-2", "shadow-md")}>
                  <Link to="." hash="tanstack-theme-setup">
                    <CodeIcon className="size-4" aria-hidden />
                    TanStack Start guide
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="md"
                  className={cn("gap-2", "border-border/80 bg-background/60 backdrop-blur-sm")}
                >
                  <Link to="." hash="theme-package-install">
                    Install <span className="font-mono text-xs">@codefast/theme</span>
                    <ArrowRightIcon className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>

            <div className={cn("relative", "lg:justify-self-end")}>
              <div
                className={cn(
                  "p-6",
                  "rounded-3xl border border-border/50 bg-card/80 shadow-xl ring-1 shadow-black/5 ring-border/40 backdrop-blur-md",
                  "dark:bg-card/60 dark:shadow-black/20",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      "text-xs font-medium tracking-wider text-muted-foreground uppercase",
                    )}
                  >
                    <SparklesIcon className={cn("size-3.5", "text-primary")} aria-hidden />
                    Live
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    @codefast/theme
                  </Badge>
                </div>
                <p
                  className={cn(
                    "mt-4",
                    "text-4xl font-bold tracking-tight text-foreground capitalize",
                    "md:text-5xl",
                    "tabular-nums",
                  )}
                >
                  {resolvedTheme}
                </p>
                <p className={cn("mt-1", "text-sm text-muted-foreground")}>Resolved appearance</p>
                <div className={cn("flex flex-wrap gap-2", "mt-4")}>
                  <span className="text-xs text-muted-foreground">Preference</span>
                  <Badge variant="outline" className="capitalize">
                    {theme}
                  </Badge>
                </div>
                <Separator className={cn("my-5", "opacity-60")} />
                <p className="text-xs text-muted-foreground">
                  Continue to appearance controls and samples.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ThemePackageInstallStrip />

      <Suspense
        fallback={
          <div
            className={cn(
              "min-h-[40vh] max-w-[1400px]",
              "mx-auto px-4 py-12",
              "sm:px-6",
              "md:py-16",
            )}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-muted-foreground">Loading theme documentation…</p>
          </div>
        }
      >
        <ThemeAppearancePageDeferred
          theme={theme}
          resolvedTheme={resolvedTheme}
          setTheme={setTheme}
        />
      </Suspense>
    </div>
  );
}
