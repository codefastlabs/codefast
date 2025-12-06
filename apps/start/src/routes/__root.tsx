import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackDevtools } from '@tanstack/react-devtools';
import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { ActiveThemeProvider } from '@/components/active-theme';
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools';
import TanStackRouterDevtools from '@/integrations/tanstack-router/devtools';
import TanStackFormDevtools from '@/integrations/tanstack-form/devtools';
import appCss from '@/styles.css?url';
import Header from '@/components/header';
import { ThemeProvider } from '@/integrations/theme/provider';
import { getThemeServerFn } from '@/integrations/theme/server';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
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

type RootShellComponentProps = {
  children: ReactNode;
};

function RootShellComponent({ children }: RootShellComponentProps) {
  const theme = Route.useLoaderData();

  return (
    <html className={theme} lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider theme={theme} disableTransitionOnChange>
          <ActiveThemeProvider>{children}</ActiveThemeProvider>
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
