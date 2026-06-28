import { AppearanceProvider, AppearanceScript, resolveColorScheme } from "@codefast/theme";
import { getColorSchemeServerFn, getRootColorSchemeServerFn, persistColorSchemeCookie } from "@codefast/theme/start";
import { cn } from "@codefast/ui/lib/utils";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
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
