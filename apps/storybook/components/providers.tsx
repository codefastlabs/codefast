'use client';

import { Toaster } from '@codefast/ui';
import { type JSX, type ReactNode } from 'react';

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
