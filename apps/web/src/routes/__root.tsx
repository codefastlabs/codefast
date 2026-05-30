import { cn } from "@codefast/tailwind-variants";
import type { ReactNode } from "react";
import { HeadContent, Link, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
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
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/logo192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  loader: () => getRootColorSchemeServerFn(),
  notFoundComponent: SiteNotFound,
  errorComponent: SiteError,
  shellComponent: RootDocument,
});

function CenteredMessage({
  badge,
  title,
  description,
  children,
}: {
  badge: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main
      className={cn(
        "container flex flex-col items-center",
        "mx-auto px-4 pt-32 pb-32",
        "text-center",
      )}
    >
      <Badge variant="outline" className={cn("mb-5", "border-border", "text-muted-foreground")}>
        {badge}
      </Badge>
      <h1 className={cn("mb-3", "text-3xl font-bold tracking-[-0.035em] text-foreground")}>
        {title}
      </h1>
      <p className="mb-8 max-w-md text-muted-foreground">{description}</p>
      {children}
    </main>
  );
}

function SiteNotFound() {
  return (
    <CenteredMessage
      badge="404"
      title="Page not found"
      description="The page you’re looking for doesn’t exist or may have moved."
    >
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </CenteredMessage>
  );
}

function SiteError({ error }: { error: Error }) {
  return (
    <CenteredMessage
      badge="Error"
      title="Something went wrong"
      description={error.message || "An unexpected error occurred. Please try again."}
    >
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </CenteredMessage>
  );
}

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
      <body
        className={cn(
          "min-h-full overflow-x-hidden wrap-anywhere",
          "bg-background font-sans text-foreground antialiased",
          "selection:bg-foreground/15",
        )}
      >
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
