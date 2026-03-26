import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Separator } from "@codefast/ui/separator";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  InfoIcon,
  LaptopIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
} from "lucide-react";
import { themes, useTheme } from "@codefast/theme";

export const Route = createFileRoute("/_app/theme/")({
  component: ThemePage,
  head: () => ({
    meta: [
      { title: "Themes — @codefast/ui" },
      {
        name: "description",
        content:
          "Explore appearance modes (light, dark, system) and see how @codefast/ui components respond. Color palettes are switched via CSS theme imports.",
      },
      { property: "og:title", content: "Themes — @codefast/ui" },
      {
        property: "og:description",
        content:
          "Explore appearance modes (light, dark, system) and see how @codefast/ui components respond. Color palettes are switched via CSS theme imports.",
      },
      { name: "twitter:title", content: "Themes — @codefast/ui" },
      {
        name: "twitter:description",
        content:
          "Explore appearance modes (light, dark, system) and see how @codefast/ui components respond. Color palettes are switched via CSS theme imports.",
      },
    ],
  }),
});

function ThemePage() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/80 bg-linear-to-b from-muted/20 to-background">
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 md:py-14">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Appearance
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Theme &amp; color mode
            </h1>
            <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
              Switch light, dark, or system mode for this site. Component previews below use your
              current tokens. For the 22 accent palettes (neutral, slate, blue, …), import a
              different{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">.css</code> file
              from{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">
                @codefast/ui
              </code>{" "}
              in your app—this site’s components section includes a theme picker for those.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/sink">Open components</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-350 space-y-8 px-4 py-10 sm:px-6 md:py-12">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PaletteIcon className="size-5" aria-hidden />
              Color mode
            </CardTitle>
            <CardDescription>
              Controls whether this documentation site uses light or dark surfaces (and whether that
              follows the OS when set to system).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
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
                    variant={isActive ? "default" : "outline"}
                    size="lg"
                    onClick={() => setTheme(themeOption)}
                    className="gap-2"
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="capitalize">{themeOption}</span>
                    {isActive ? <CheckCircle2Icon className="size-4" aria-hidden /> : null}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Current state</CardTitle>
              <CardDescription>
                Values from <code className="font-mono text-xs">useTheme()</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">What you get</CardTitle>
              <CardDescription>
                Behavior provided by <code className="font-mono text-xs">@codefast/theme</code> in
                this app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2Icon
                    className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400"
                    aria-hidden
                  />
                  <span>Light, dark, and system (follow OS) modes.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2Icon
                    className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400"
                    aria-hidden
                  />
                  <span>
                    Persisted preference (cookie) with SSR-friendly script to limit flash.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2Icon
                    className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400"
                    aria-hidden
                  />
                  <span>
                    Tab sync and sensible{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs">color-scheme</code> on
                    the document.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2Icon
                    className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400"
                    aria-hidden
                  />
                  <span>
                    <code className="rounded bg-muted px-1 font-mono text-xs">
                      disableTransitionOnChange
                    </code>{" "}
                    enabled in the root shell to avoid jarring transitions while swapping modes.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <InfoIcon className="size-5" aria-hidden />
              Transitions while changing mode
            </CardTitle>
            <CardDescription>
              While the theme switches, CSS transitions are briefly suppressed so colors snap
              consistently; they work again for hover and other interactions afterward.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <InfoIcon className="size-4" aria-hidden />
              <AlertTitle>Configured in the app shell</AlertTitle>
              <AlertDescription className={"block"}>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  disableTransitionOnChange
                </code>{" "}
                is set on{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  ThemeProvider
                </code>{" "}
                in the root route. Toggle light/dark above—the samples below should update without a
                long cross-fade.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Samples with transitions</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="transition-all duration-500 hover:scale-[1.02] hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-sm">Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Hover for scale/shadow; mode changes should still feel instant.
                    </p>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-center rounded-xl border border-border/80 bg-card p-4 transition-all duration-500 hover:bg-accent">
                  <Button className="transition-all duration-500 hover:scale-105">Button</Button>
                </div>

                <div className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card p-4 transition-all duration-500 hover:border-primary">
                  <Badge className="transition-all duration-500 hover:scale-105">Badge</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-linear-to-r from-primary/10 to-secondary/10 p-6 transition-all duration-700">
                <h4 className="mb-2 text-sm font-semibold text-foreground">Long transition box</h4>
                <p className="text-xs text-muted-foreground">
                  Uses a 700ms transition for hover; appearance mode switches should not animate
                  through intermediate colors.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Try it</h4>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Use the mode buttons at the top of the page.</li>
                  <li>Notice UI colors update immediately without a slow blend.</li>
                  <li>Hover the samples—transitions should behave normally again.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Component preview</CardTitle>
            <CardDescription>Common primitives using current semantic tokens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Alert</h3>
              <Alert>
                <InfoIcon className="size-4" aria-hidden />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription className={"block"}>
                  Alerts, cards, and borders follow{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs">background</code>,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs">foreground</code>, and
                  related tokens.
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Cards</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Surface</CardTitle>
                    <CardDescription>Card background and radius</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Uses theme card tokens.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Typography</CardTitle>
                    <CardDescription>Muted vs foreground</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Body text uses muted foreground.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Borders</CardTitle>
                    <CardDescription>Border token</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Outlines respect the active mode.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <InfoIcon className="size-4" aria-hidden />
          <AlertTitle>How it fits together</AlertTitle>
          <AlertDescription className="block text-muted-foreground">
            <code className="rounded bg-muted px-1 font-mono text-xs">@codefast/theme</code> keeps
            the appearance preference and applies the right class on the document. Tailwind (
            <code className="rounded bg-muted px-1 font-mono text-xs">dark:</code> variants and CSS
            variables from the UI preset) does the rest. Accent palettes are separate: choose a
            theme stylesheet from the package, as in the install snippet on the home page.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
