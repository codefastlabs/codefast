import { TanStackDevtools } from '@tanstack/react-devtools';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import TanStackFormDevtools from '@/integrations/tanstack-form/devtools';
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools';
import TanStackRouterDevtools from '@/integrations/tanstack-router/devtools';
import { ThemeProvider, ThemeScript, getThemeServerFn } from '@/integrations/theme';
import appCss from '@/styles/globals.css?url';

interface RootRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  loader: () => getThemeServerFn(),
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
  const theme = Route.useLoaderData();

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <ThemeScript theme={theme} />
      </head>
      <body>
        <ThemeProvider theme={theme} disableTransitionOnChange>
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
