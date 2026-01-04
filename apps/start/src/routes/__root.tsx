import { TanStackDevtools } from '@tanstack/react-devtools';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { getThemeServerFn, setThemeServerFn } from '@codefast/theme/adapters/tanstack-start';
import { ThemeProvider, ThemeScript, resolveTheme } from '@codefast/theme';
import type { QueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import TanStackFormDevtools from '@/integrations/tanstack-form/devtools';
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools';
import TanStackRouterDevtools from '@/integrations/tanstack-router/devtools';
import appCss from '@/styles/globals.css?url';

interface RootRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  loader: async () => {
    const theme = await getThemeServerFn();
    const resolvedTheme = resolveTheme(theme);

    return { theme, resolvedTheme };
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start Starter' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootShellComponent,
});

function RootShellComponent({ children }: PropsWithChildren) {
  const { theme, resolvedTheme } = Route.useLoaderData();

  return (
    <html className={resolvedTheme} lang="en" style={{ colorScheme: resolvedTheme }} suppressHydrationWarning>
      <head>
        <HeadContent />
        <ThemeScript theme={theme} />
      </head>
      <body>
        <ThemeProvider
          theme={theme}
          persistTheme={(value) => setThemeServerFn({ data: value })}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[TanStackRouterDevtools, TanStackQueryDevtools, TanStackFormDevtools]}
        />
        <Scripts />
      </body>
    </html>
  );
}
