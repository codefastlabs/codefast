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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
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
      className={resolvedColorScheme}
      style={{ colorScheme: resolvedColorScheme }}
      suppressHydrationWarning
    >
      <head>
        <AppearanceScript colorScheme={colorScheme} />
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere antialiased selection:bg-[rgba(79,184,178,0.24)]">
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
