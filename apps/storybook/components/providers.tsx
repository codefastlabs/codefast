'use client';

import type { JSX, ReactNode } from 'react';

import { Toaster } from '@codefast/ui';

interface ProvidersProps {
  children?: ReactNode | undefined;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <>
      <div vaul-drawer-wrapper="">{children}</div>
      <Toaster />
    </>
  );
}
