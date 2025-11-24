import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackDevtools } from '@tanstack/react-devtools';
import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools';
import TanStackRouterDevtools from '@/integrations/tanstack-router/devtools';
import TanStackFormDevtools from '@/integrations/tanstack-form/devtools';
import { getThemeScript } from '@/integrations/theme/provider';
import appCss from '@/styles.css?url';
import Header from '@/components/header';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootShellComponent,
});

type RootShellComponentProps = {
  children: ReactNode;
};

function RootShellComponent({ children }: RootShellComponentProps) {
  const themeScript = getThemeScript();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        {children}
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
