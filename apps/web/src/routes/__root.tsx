import type { ReactNode } from "react";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { AppearanceProvider, AppearanceScript, resolveColorScheme } from "@codefast/theme";
import {
  getRootColorSchemeServerFn,
  getColorSchemeServerFn,
  persistColorSchemeCookie,
} from "@codefast/theme/start";
import { Footer } from "#/components/footer";
import { Header } from "#/components/header";
import appCss from "#/styles.css?url";

const SITE_NAME = "codefast/ui";
const SITE_TITLE = "codefast/ui — Beautiful, accessible React components";
const SITE_DESCRIPTION =
  "60+ accessible React components built on Radix UI primitives and Tailwind CSS v4. Copy the source, own the code — strict TypeScript, dark mode, and zero config.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "theme-color", content: "#0ea5e9" },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  loader: () => getRootColorSchemeServerFn(),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  const { colorScheme, ssrColorScheme } = Route.useLoaderData();
  const resolvedColorScheme = resolveColorScheme(colorScheme, ssrColorScheme);

  return (
    <html
      lang="en"
      className={`${resolvedColorScheme} min-h-full`}
      style={{ colorScheme: resolvedColorScheme }}
      suppressHydrationWarning
    >
      <head>
        <AppearanceScript colorScheme={colorScheme} />
        <HeadContent />
      </head>
      <body className="min-h-full overflow-x-hidden bg-background font-sans wrap-anywhere text-foreground antialiased selection:bg-foreground/15">
        <AppearanceProvider
          colorScheme={colorScheme}
          ssrColorScheme={ssrColorScheme}
          persistColorScheme={persistColorSchemeCookie}
          syncFromServer={getColorSchemeServerFn}
        >
          <Header />
          {children}
          <Footer />
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </AppearanceProvider>
        <Scripts />
      </body>
    </html>
  );
}
