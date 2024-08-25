'use client';

import { Toaster } from '@codefast/ui/sonner';
import { Provider as JotaiProvider } from 'jotai';
import { type JSX, type ReactNode } from 'react';

interface ProvidersProps {
  children?: ReactNode | undefined;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <JotaiProvider>
      <div vaul-drawer-wrapper="">{children}</div>
      <Toaster />
    </JotaiProvider>
  );
}
