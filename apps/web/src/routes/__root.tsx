import type { ReactNode } from "react";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ThemeProvider, ThemeScript, resolveTheme } from "@codefast/theme";
import { getRootThemeServerFn, getThemeServerFn, persistThemeCookie } from "@codefast/theme/start";
import Footer from "#/components/Footer";
import Header from "#/components/Header";
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
  loader: () => getRootThemeServerFn(),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  const { theme, ssrSystemTheme } = Route.useLoaderData();
  const resolvedTheme = resolveTheme(theme, ssrSystemTheme);

  return (
    <html
      lang="en"
      className={resolvedTheme}
      style={{ colorScheme: resolvedTheme }}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript theme={theme} />
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere antialiased selection:bg-[rgba(79,184,178,0.24)]">
        <ThemeProvider
          theme={theme}
          ssrSystemTheme={ssrSystemTheme}
          persistTheme={persistThemeCookie}
          syncThemeFromServer={getThemeServerFn}
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
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
