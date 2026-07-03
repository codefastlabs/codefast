import {
  AppearanceProvider,
  AppearanceScript,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_RESOLVED_COLOR_SCHEME,
} from "@codefast/theme";
import { STORAGE_KEY } from "@codefast/theme/constants";
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
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  // Server-rendered HTML can't know the preference at request time; the script overwrites this
  // class before paint and `suppressHydrationWarning` lets the mismatch through.
  return (
    <html
      lang="en"
      className={cn(DEFAULT_RESOLVED_COLOR_SCHEME, "min-h-full")}
      // "light dark": the pre-paint blank frame follows the OS instead of flashing dark on reload;
      // the inline script overwrites this with the resolved value before paint.
      style={{ colorScheme: "light dark" }}
      data-appearance={DEFAULT_COLOR_SCHEME}
      suppressHydrationWarning
    >
      <head>
        {/* Client-only via storageKey: the preference lives in localStorage — no server fn, no loader. */}
        <AppearanceScript colorScheme={DEFAULT_COLOR_SCHEME} storageKey={STORAGE_KEY} />
        <HeadContent />
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <AppearanceProvider colorScheme={DEFAULT_COLOR_SCHEME} storageKey={STORAGE_KEY}>
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
