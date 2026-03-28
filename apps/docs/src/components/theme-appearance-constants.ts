export const TANSTACK_ROOT_SNIPPET = `// src/routes/__root.tsx — TanStack Start + @codefast/theme
import type { PropsWithChildren } from "react";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { createPersistTheme, getThemeServerFn } from "@codefast/theme/adapters/tanstack-start";
import { ThemeProvider, ThemeScript, resolveTheme } from "@codefast/theme";

// Use your real router context type instead of \`YourRouterContext\`.
export const Route = createRootRouteWithContext<YourRouterContext>()({
  loader: async () => ({ theme: await getThemeServerFn() }),
  shellComponent: RootShellComponent,
});

const persistTheme = createPersistTheme();

function RootShellComponent({ children }: PropsWithChildren) {
  const { theme } = Route.useLoaderData();
  const resolvedTheme = resolveTheme(theme);

  return (
    <html
      className={resolvedTheme}
      lang="en"
      style={{ colorScheme: resolvedTheme }}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
        <ThemeScript theme={theme} />
      </head>
      <body>
        <ThemeProvider
          theme={theme}
          persistTheme={persistTheme}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

// Anywhere else: import { useTheme } from "@codefast/theme";`;

export const PNPM_INSTALL = "pnpm add @codefast/theme";

export const USE_THEME_TOGGLE_SNIPPET = `import { Button } from "@codefast/ui/button";
import { useTheme } from "@codefast/theme";

export function ThemeMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme} (pref: {theme})
    </Button>
  );
}`;
