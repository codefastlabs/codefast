'use client';

import { Toaster } from '@codefast/ui/sonner';
import { type JSX, type ReactNode } from 'react';
import { RecoilRoot } from 'recoil';

interface ProvidersProps {
  children?: ReactNode | undefined;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <RecoilRoot>
      <div vaul-drawer-wrapper="">{children}</div>
      <Toaster />
    </RecoilRoot>
  );
}
