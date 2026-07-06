import { AppearanceProvider, AppearanceScript, DEFAULT_APPEARANCE, DEFAULT_COLOR_SCHEME } from "@codefast/theme";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { TooltipProvider } from "@codefast/ui/tooltip";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Link, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";

import { Analytics } from "#/components/layout/analytics";
import { Footer } from "#/components/layout/footer";
import { Header } from "#/components/layout/header";
import { NotFound } from "#/components/shared/not-found";
import { SiteNotFound } from "#/components/shared/site-not-found";
import { SITE_OG_IMAGE } from "#/lib/seo";

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
      { property: "og:image", content: SITE_OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: SITE_TITLE },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: SITE_OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/logo192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  notFoundComponent: SiteNotFound,
  errorComponent: SiteError,
  shellComponent: RootDocument,
});

function SiteError({ error }: { error: Error }) {
  return (
    <NotFound
      badge="Error"
      title="Something went wrong"
      description={error.message || "An unexpected error occurred. Please try again."}
      action={
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      }
    />
  );
}

/**
 * Document shell. Prerendered HTML can't know the stored appearance at build time, so it renders
 * the defaults; `AppearanceScript` applies the resolved color scheme before first paint and
 * `suppressHydrationWarning` absorbs the mismatch.
 */
function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(DEFAULT_COLOR_SCHEME, "min-h-full")}
      /* "light dark": the pre-paint frame follows the OS color scheme instead of flashing dark
         on reload; AppearanceScript sets the resolved value before paint. */
      style={{ colorScheme: "light dark" }}
      data-appearance={DEFAULT_APPEARANCE}
      suppressHydrationWarning
    >
      <head>
        {/* Client-only appearance via localStorage (default STORAGE_KEY): no server fn or loader,
            so `defaultPreload: "intent"` has nothing to re-fetch on nav-link hover. */}
        <AppearanceScript />
        <HeadContent />
      </head>
      <body className="min-h-full overflow-x-hidden bg-ui-bg font-sans wrap-anywhere text-ui-fg antialiased selection:bg-ui-fg/15">
        <AppearanceProvider>
          <TooltipProvider>
            <Header />
            {children}
            <Footer />
          </TooltipProvider>
          {/* `@tanstack/devtools-vite` strips this whole block from production builds — keep it
              rendered unconditionally; do not wrap it in an `import.meta.env.DEV` guard (the plugin's
              code removal would leave invalid syntax behind and break the build). */}
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
        <Analytics />
        <Scripts />
      </body>
    </html>
  );
}
