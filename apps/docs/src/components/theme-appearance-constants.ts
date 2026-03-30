export const TANSTACK_ROOT_SNIPPET = `// src/routes/__root.tsx — TanStack Start + @codefast/theme
import type { PropsWithChildren } from "react";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { getRootThemeServerFn, getThemeServerFn, persistThemeCookie } from "@codefast/theme/start";
import { ThemeProvider, ThemeScript, resolveTheme } from "@codefast/theme";

// Use your real router context type instead of \`YourRouterContext\`.
export const Route = createRootRouteWithContext<YourRouterContext>()({
  loader: async () => getRootThemeServerFn(),
  shellComponent: RootShellComponent,
});

function RootShellComponent({ children }: PropsWithChildren) {
  const { theme, ssrSystemTheme } = Route.useLoaderData();
  const resolvedTheme = resolveTheme(theme, ssrSystemTheme);

  return (
    <html className={resolvedTheme} lang="en" style={{ colorScheme: resolvedTheme }} suppressHydrationWarning>
      <head>
        <HeadContent />
        <ThemeScript theme={theme} />
      </head>
      <body>
        <ThemeProvider
          theme={theme}
          ssrSystemTheme={ssrSystemTheme}
          persistTheme={persistThemeCookie}
          syncThemeFromServer={getThemeServerFn}
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
