import { AppearanceProvider, AppearanceScript, resolveColorScheme } from "@codefast/theme";
import { getColorSchemeServerFn, getRootColorSchemeServerFn, persistColorSchemeCookie } from "@codefast/theme/start";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { HeadContent, Link, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SiteHeader } from "#/components/site-header";

import appCss from "#/styles.css?url";

const TITLE = "CodeFast × TanStack Start — npm consumer demo";
const DESCRIPTION =
  "A TanStack Start app that consumes the published @codefast/* packages straight from npm: UI components, color-scheme theming, tailwind-variants, and server-side DI.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  // `getRootColorSchemeServerFn` reads the httpOnly cookie on the server so the first paint
  // already has the right color scheme — no flash. It comes from `@codefast/theme/start`.
  loader: () => getRootColorSchemeServerFn(),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  const { colorScheme, ssrColorScheme } = Route.useLoaderData();
  const resolvedColorScheme = resolveColorScheme(colorScheme, ssrColorScheme);

  return (
    <html
      lang="en"
      className={cn(resolvedColorScheme, "min-h-full")}
      style={{ colorScheme: resolvedColorScheme }}
      suppressHydrationWarning
    >
      <head>
        <AppearanceScript colorScheme={colorScheme} />
        <HeadContent />
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <AppearanceProvider
          colorScheme={colorScheme}
          ssrColorScheme={ssrColorScheme}
          persistColorScheme={persistColorSchemeCookie}
          syncFromServer={getColorSchemeServerFn}
        >
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">{children}</main>
        </AppearanceProvider>
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        No route matches that URL. Pick a section from the header, or head back to the overview.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Back to overview</Link>
      </Button>
    </div>
  );
}
